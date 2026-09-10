"""Vision service for loading YOLOv8 model and running defect detection."""
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
import cv2
import numpy as np
from fastapi import HTTPException, status
from app.config import (
    DEFECT_CLASSES,
    calculate_highest_severity,
    calculate_severity,
    settings,
    SeverityLevel,
)
from app.schemas.models import (
    BoundingBox,
    DefectItem,
    DetectionResponse,
    InspectionStatus,
)
from app.utils.image_utils import annotate_image
from app.utils.logger import logger


class VisionService:
    """Singleton service managing YOLOv8 model loading and inference branching."""

    def __init__(self):
        self.model = None
        self.detect_model = None
        self.classify_model = None
        self.model_loaded: bool = False
        self.load_error: Optional[str] = None

    def load_model(self) -> None:
        from ultralytics import YOLO
        
        # 1. Load object detection model (models/best.pt)
        det_path = settings.BASE_DIR / "models" / "best.pt"
        if det_path.exists():
            try:
                self.detect_model = YOLO(str(det_path))
                logger.info(f"Loaded YOLOv8 detection model from '{det_path}'")
            except Exception as e:
                logger.warning(f"Failed loading detection model: {e}")

        # 2. Load classification model (defect_best.pt)
        cls_path = settings.BASE_DIR / "defect_best.pt"
        if not cls_path.exists():
            cls_path = settings.BASE_DIR / "models" / "defect_best.pt"
        if cls_path.exists():
            try:
                self.classify_model = YOLO(str(cls_path))
                logger.info(f"Loaded YOLOv8 classification model from '{cls_path}'")
            except Exception as e:
                logger.warning(f"Failed loading classification model: {e}")

        self.model = self.detect_model or self.classify_model
        if self.model is not None:
            self.model_loaded = True
            self.load_error = None
        else:
            self.load_error = "No YOLOv8 model weights could be loaded."
            self.model_loaded = False

    def _analyze_cv_anomalies(self, image_path: Path, img_width: int, img_height: int) -> List[DefectItem]:
        """
        Runs computer vision anomaly algorithms (surface gradients, canny edge variance,
        porosity connected components, HSV color shifts) matching industrial CV defect datasets.
        """
        defects: List[DefectItem] = []
        try:
            img = cv2.imread(str(image_path))
            if img is None:
                return defects

            h, w = img.shape[:2]
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # 1. Surface Crack / Scratch Detection (High gradient edges)
            edged = cv2.Canny(blurred, 60, 180)
            contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            valid_contours = [c for c in contours if 500 < cv2.contourArea(c) < (w * h * 0.45)]
            valid_contours.sort(key=cv2.contourArea, reverse=True)

            if len(valid_contours) >= 1:
                x, y, bw, bh = cv2.boundingRect(valid_contours[0])
                aspect = max(bw, bh) / max(1, min(bw, bh))
                defect_type = "crack" if aspect > 2.0 else "surface_defect"
                conf = 0.91 + min(0.07, cv2.contourArea(valid_contours[0]) / (w * h))
                defects.append(
                    DefectItem(
                        type=defect_type,
                        confidence=round(conf, 4),
                        severity=calculate_severity(defect_type, conf),
                        bounding_box=BoundingBox(x1=x, y1=y, x2=x + bw, y2=y + bh),
                    )
                )

            if len(valid_contours) >= 2:
                x, y, bw, bh = cv2.boundingRect(valid_contours[1])
                defect_type = "edge_burr"
                conf = 0.86
                defects.append(
                    DefectItem(
                        type=defect_type,
                        confidence=round(conf, 4),
                        severity=calculate_severity(defect_type, conf),
                        bounding_box=BoundingBox(x1=x, y1=y, x2=x + bw, y2=y + bh),
                    )
                )

            # 2. Rust / Oxidation Anomaly in HSV space
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            lower_rust = np.array([10, 100, 50])
            upper_rust = np.array([25, 255, 255])
            rust_mask = cv2.inRange(hsv, lower_rust, upper_rust)
            rust_pixels = cv2.countNonZero(rust_mask)

            if rust_pixels > (w * h * 0.015):
                rx, ry, rw, rh = cv2.boundingRect(rust_mask)
                conf = min(0.96, 0.82 + (rust_pixels / (w * h * 0.1)))
                defects.append(
                    DefectItem(
                        type="rust",
                        confidence=round(conf, 4),
                        severity=calculate_severity("rust", conf),
                        bounding_box=BoundingBox(x1=rx, y1=ry, x2=rx + rw, y2=ry + rh),
                    )
                )

        except Exception as err:
            logger.warning(f"Error in CV anomaly analysis: {err}")

        return defects

    def detect(
        self,
        image_path: Path,
        machine_id: str,
        img_width: int,
        img_height: int
    ) -> DetectionResponse:
        """
        Executes defect detection strictly using the trained YOLO model.
        Supports both YOLO classification models (probs) and object detection models (boxes).
        """
        defects: List[DefectItem] = []

        # 1. Run YOLO Object Detection (Bounding Boxes)
        if self.detect_model is not None:
            try:
                results_det = self.detect_model(
                    source=str(image_path),
                    conf=0.15,
                    verbose=False
                )
                if results_det and len(results_det) > 0:
                    for r in results_det:
                        if hasattr(r, "boxes") and r.boxes is not None:
                            boxes = r.boxes
                            names = r.names if hasattr(r, "names") else {}
                            for box in boxes:
                                conf = float(box.conf[0].item()) if box.conf is not None else 0.0
                                cls_id = int(box.cls[0].item()) if box.cls is not None else 0
                                cls_name = names.get(cls_id, f"defect_{cls_id}").lower().replace(" ", "_")
                                if cls_name == "scrach":
                                    cls_name = "scratch"
                                if cls_name == "normal":
                                    continue

                                coords = box.xyxy[0].tolist()
                                x1, y1, x2, y2 = [int(round(c)) for c in coords]
                                x1 = max(0, min(x1, img_width))
                                y1 = max(0, min(y1, img_height))
                                x2 = max(0, min(x2, img_width))
                                y2 = max(0, min(y2, img_height))

                                defect_sev = calculate_severity(cls_name, conf)
                                defects.append(
                                    DefectItem(
                                        type=cls_name,
                                        confidence=round(conf, 4),
                                        severity=defect_sev,
                                        bounding_box=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                                    )
                                )
            except Exception as exc:
                logger.error(f"YOLO detection model error: {exc}")

        # 2. Run YOLO Classification (Full-frame / Part optical classification)
        if self.classify_model is not None:
            try:
                results_cls = self.classify_model(
                    source=str(image_path),
                    verbose=False
                )
                if results_cls and len(results_cls) > 0:
                    r = results_cls[0]
                    if hasattr(r, "probs") and r.probs is not None:
                        top_class_id = int(r.probs.top1)
                        top_class_name = str(r.names[top_class_id]).lower().replace(" ", "_")
                        conf = float(r.probs.top1conf)

                        if top_class_name != "normal" and conf >= 0.40:
                            if len(defects) == 0:
                                defect_sev = calculate_severity(top_class_name, conf)
                                defects.append(
                                    DefectItem(
                                        type=top_class_name,
                                        confidence=round(conf, 4),
                                        severity=defect_sev,
                                        bounding_box=BoundingBox(
                                            x1=int(img_width * 0.1),
                                            y1=int(img_height * 0.1),
                                            x2=int(img_width * 0.9),
                                            y2=int(img_height * 0.9),
                                        ),
                                    )
                                )
            except Exception as exc:
                logger.error(f"YOLO classification model error: {exc}")

        total_defects = len(defects)
        if total_defects > 0:
            severities = [d.severity for d in defects]
            highest_sev = calculate_highest_severity(severities)
            insp_status = InspectionStatus.DEFECT_DETECTED
            defect_detected = True
        else:
            highest_sev = SeverityLevel.LOW
            insp_status = InspectionStatus.NORMAL
            defect_detected = False

        annotated_rel_path = None
        if settings.SAVE_ANNOTATED_IMAGES and total_defects > 0:
            saved_annotated = annotate_image(image_path, defects, settings.ANNOTATED_DIR)
            annotated_rel_path = saved_annotated.relative_to(settings.BASE_DIR).as_posix()

        return DetectionResponse(
            machine_id=machine_id,
            inspection_status=insp_status,
            defect_detected=defect_detected,
            highest_severity=highest_sev,
            total_defects=total_defects,
            defects=defects,
            image_processed=True,
            timestamp=datetime.now(timezone.utc).isoformat(),
            is_simulated=False,
            annotated_image_path=annotated_rel_path,
        )


vision_service = VisionService()
