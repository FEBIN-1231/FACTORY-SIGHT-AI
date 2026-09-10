"""Thread-safe Real-time Computer Vision video stream with live camera tracking and defect status."""
import threading
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import cv2
import numpy as np
from app.services.vision_service import vision_service
from app.utils.logger import logger


class VideoStreamService:
    """Manages continuous background camera capture, YOLO defect inference, and MJPEG streaming."""

    def __init__(self):
        self.fps = 60.0
        self.width = 640
        self.height = 480
        self.camera_active = False
        self.active_camera_index = 0  # Default to RGB webcam (Camera 0)
        self.preferred_camera_index = 0
        self._current_detections: List[Dict[str, Any]] = []
        self._latest_jpeg_bytes: Optional[bytes] = None
        self._latest_raw_frame: Optional[np.ndarray] = None
        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._last_inference_ms = 12.0
        self._need_reconnect = False
        self.start()

    def start(self):
        """Starts the background camera acquisition and inference thread."""
        if self._thread is None or not self._thread.is_alive():
            self._running = True
            self._thread = threading.Thread(target=self._capture_loop, daemon=True)
            self._thread.start()
            logger.info("Background video capture worker thread started.")

    def stop(self):
        """Stops the camera worker."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)

    def set_camera_index(self, index: int):
        """Switches preferred camera index."""
        with self._lock:
            self.preferred_camera_index = index
            self._need_reconnect = True
            logger.info(f"Switched preferred camera index to {index}")

    def _open_camera(self) -> Optional[cv2.VideoCapture]:
        """Tries to open Camera 0 exclusively with DirectShow at 60 FPS."""
        try:
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if cap.isOpened():
                cap.set(cv2.CAP_PROP_FPS, 60.0)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                test_frame = None
                ret = False
                for _ in range(10):
                    ret, test_frame = cap.read()
                    if ret and test_frame is not None and test_frame.size > 0:
                        break
                    time.sleep(0.02)

                if ret and test_frame is not None and test_frame.size > 0:
                    self.active_camera_index = 0
                    logger.info(f"Successfully connected to Camera 0 at 60 FPS (brightness={np.mean(test_frame):.1f}) with shape {test_frame.shape}")
                    return cap
                cap.release()
        except Exception as e:
            logger.debug(f"Failed opening camera 0: {e}")
        return None

    def _capture_loop(self):
        """Background loop continuously reading frames from camera and running YOLO inference."""
        cap: Optional[cv2.VideoCapture] = None

        while self._running:
            with self._lock:
                if self._need_reconnect:
                    if cap is not None:
                        cap.release()
                        cap = None
                    self._need_reconnect = False

            if cap is None or not cap.isOpened():
                cap = self._open_camera()
                if cap is None:
                    # Generate placeholder while waiting for camera
                    placeholder = self._draw_connecting_frame()
                    with self._lock:
                        self._latest_jpeg_bytes = placeholder
                        self.camera_active = False
                    time.sleep(1.0)
                    continue

            success, frame = cap.read()
            if not success or frame is None or frame.size == 0:
                logger.warning("Camera frame read failed; attempting reconnection...")
                cap.release()
                cap = None
                with self._lock:
                    self.camera_active = False
                time.sleep(0.5)
                continue

            # Save copy of raw frame before annotations for snapshot scans
            raw_copy = frame.copy()

            # Process frame with YOLO defect model
            start_t = time.time()
            now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
            h, w = frame.shape[:2]
            detections: List[Dict[str, Any]] = []
            # Process frame with Dual YOLO defect models (Detect + Classify)
            start_t = time.time()
            now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
            h, w = frame.shape[:2]
            detections: List[Dict[str, Any]] = []
            top_label = "NORMAL"
            top_conf = 98.4
            is_defect = False

            # 1. Run Object Detection Model (Bounding Boxes: Dent, Hole, Rust, Scratch)
            if vision_service.detect_model is not None:
                try:
                    res_det = vision_service.detect_model(frame, conf=0.15, verbose=False)
                    if res_det and len(res_det) > 0:
                        r = res_det[0]
                        if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
                            names = r.names if hasattr(r, "names") else {}
                            for idx, box in enumerate(r.boxes):
                                b_conf = float(box.conf[0].item()) if box.conf is not None else 0.0
                                cls_id = int(box.cls[0].item()) if box.cls is not None else 0
                                cls_name = names.get(cls_id, f"defect_{cls_id}").lower().replace(" ", "_")
                                if cls_name == "scrach":
                                    cls_name = "scratch"
                                if cls_name == "normal":
                                    continue

                                is_defect = True
                                top_label = cls_name.upper()
                                top_conf = b_conf * 100.0

                                coords = box.xyxy[0].tolist()
                                x1, y1, x2, y2 = [int(round(c)) for c in coords]
                                bw, bh = x2 - x1, y2 - y1

                                # Draw bounding box on live video frame
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                                label_bg_w = min(w - x1, 180)
                                cv2.rectangle(frame, (x1, max(0, y1 - 25)), (x1 + label_bg_w, y1), (0, 0, 255), -1)
                                cv2.putText(frame, f"{cls_name.upper()} {top_conf:.1f}%", (x1 + 4, max(18, y1 - 6)),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

                                display_name = cls_name.replace("_", " ").title()
                                severity = "High" if b_conf > 0.50 else "Moderate"

                                detections.append({
                                    "id": f"DEF-{8820 + len(detections) + 1}",
                                    "class": cls_name,
                                    "type": cls_name,
                                    "defectType": display_name,
                                    "confidence": f"{top_conf:.1f}",
                                    "severity": severity,
                                    "machine": "M-03 (Laser Scribing)",
                                    "camera": f"CAM-0{self.active_camera_index + 1} (Live Optical Feed)",
                                    "category": display_name,
                                    "coordinates": {
                                        "x": round((x1 / w) * 100, 1),
                                        "y": round((y1 / h) * 100, 1),
                                        "w": round((bw / w) * 100, 1),
                                        "h": round((bh / h) * 100, 1),
                                    },
                                    "bbox": [x1, y1, bw, bh],
                                    "verified": False,
                                    "timestamp": now_str,
                                    "notes": f"Detected {display_name} via YOLOv8 bounding box.",
                                })
                except Exception as exc:
                    logger.debug(f"YOLO detection inference error on live frame: {exc}")

            # 2. Run Classification Model (Whole-surface Optical Classification)
            if vision_service.classify_model is not None:
                try:
                    res_cls = vision_service.classify_model(frame, verbose=False)
                    if res_cls and len(res_cls) > 0:
                        r = res_cls[0]
                        if hasattr(r, "probs") and r.probs is not None:
                            top_class_id = int(r.probs.top1)
                            top_class_name = str(r.names[top_class_id]).lower().replace(" ", "_")
                            conf_val = float(r.probs.top1conf) * 100.0

                            if top_class_name != "normal" and conf_val >= 40.0:
                                if not is_defect:
                                    is_defect = True
                                    top_label = top_class_name.upper()
                                    top_conf = conf_val
                                    display_name = top_class_name.replace("_", " ").title()
                                    severity = "High" if conf_val > 60.0 else "Moderate"

                                    # Draw optical inspection detection zone
                                    cv2.rectangle(frame, (int(w * 0.1), int(h * 0.1)), (int(w * 0.9), int(h * 0.9)), (0, 0, 255), 2)
                                    cv2.putText(frame, f"[AI FLAG: {top_label} {top_conf:.1f}%]", (int(w * 0.12), int(h * 0.18)),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2, cv2.LINE_AA)

                                    detections.append({
                                        "id": f"DEF-{8820 + len(detections) + 1}",
                                        "class": top_class_name,
                                        "type": top_class_name,
                                        "defectType": display_name,
                                        "confidence": f"{conf_val:.1f}",
                                        "severity": severity,
                                        "machine": "M-03 (Laser Scribing)",
                                        "camera": f"CAM-0{self.active_camera_index + 1} (Live Optical Feed)",
                                        "category": display_name,
                                        "coordinates": {"x": 10.0, "y": 10.0, "w": 80.0, "h": 80.0},
                                        "bbox": [int(w * 0.1), int(h * 0.1), int(w * 0.8), int(h * 0.8)],
                                        "verified": False,
                                        "timestamp": now_str,
                                        "notes": f"Optical classification: {display_name} via YOLOv8.",
                                    })
                            elif not is_defect and top_class_name == "normal":
                                top_label = "NORMAL"
                                top_conf = conf_val
                except Exception as exc:
                    logger.debug(f"YOLO classification error on live frame: {exc}")

            # Draw Label HUD
            color = (0, 0, 255) if is_defect else (0, 255, 0)
            label_text = f"{top_label}: {top_conf:.1f}%"

            cv2.rectangle(frame, (10, 10), (350, 65), (0, 0, 0), -1)
            cv2.rectangle(frame, (10, 10), (350, 65), color, 2)
            cv2.putText(frame, label_text, (20, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2, cv2.LINE_AA)

            cam_tag = f"CAM-0{self.active_camera_index + 1} [LIVE OPTICAL FEED]"
            cv2.putText(frame, cam_tag, (max(20, w - 340), 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
            cv2.putText(frame, f"UTC {now_str}", (max(20, w - 140), 50), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1, cv2.LINE_AA)

            ret, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
            if ret:
                with self._lock:
                    self._latest_jpeg_bytes = buffer.tobytes()
                    self._latest_raw_frame = raw_copy
                    self._current_detections = detections
                    self.camera_active = True
                    self._last_inference_ms = round((time.time() - start_t) * 1000, 1)

            time.sleep(1.0 / self.fps)

        if cap is not None:
            cap.release()

    def get_latest_raw_frame(self) -> Optional[np.ndarray]:
        """Returns the latest un-annotated raw camera frame."""
        with self._lock:
            return self._latest_raw_frame.copy() if self._latest_raw_frame is not None else None

    def get_latest_jpeg(self) -> Optional[bytes]:
        """Returns the latest annotated JPEG frame bytes."""
        with self._lock:
            return self._latest_jpeg_bytes

    def _draw_connecting_frame(self) -> bytes:
        """Generates fallback connecting graphic."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = (15, 23, 42)
        for x in range(0, self.width, 40):
            cv2.line(frame, (x, 0), (x, self.height), (30, 41, 59), 1)
        for y in range(0, self.height, 40):
            cv2.line(frame, (0, y), (self.width, y), (30, 41, 59), 1)
        cx, cy = self.width // 2, self.height // 2
        cv2.circle(frame, (cx, cy), 30, (6, 182, 212), 1)
        cv2.rectangle(frame, (10, 10), (350, 65), (0, 0, 0), -1)
        cv2.putText(frame, "CONNECTING CAMERA...", (20, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 255), 2, cv2.LINE_AA)
        ret, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        return buffer.tobytes() if ret else b""

    def get_current_detections(self) -> List[Dict[str, Any]]:
        """Returns the synchronized defect detections list."""
        with self._lock:
            return list(self._current_detections)

    def get_status(self) -> Dict[str, Any]:
        """Returns JSON detection status payload matching the frontend polling contract."""
        detections = self.get_current_detections()
        with self._lock:
            active = self.camera_active
            lat = self._last_inference_ms
            cam_idx = self.active_camera_index

        return {
            "status": "online",
            "source": f"laptop_camera_{cam_idx}" if active else "connecting",
            "camera_active": active,
            "camera_index": cam_idx,
            "fps": round(self.fps, 1),
            "camera": f"CAM-0{cam_idx + 1} (Laptop Camera Live)",
            "machine": "M-03 (Laser Scribing Unit)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "inspection_status": "DEFECT_DETECTED" if len(detections) > 0 else "NORMAL",
            "total_defects": len(detections),
            "detections": detections,
            "latency_ms": lat,
            "model": f"YOLOv8 {getattr(vision_service.model, 'task', 'detect')} (best.pt)",
        }

    def generate_frames(self):
        """Yields continuous JPEG frames at 30 FPS to connected streaming clients."""
        while True:
            with self._lock:
                frame_bytes = self._latest_jpeg_bytes

            if frame_bytes is None:
                frame_bytes = self._draw_connecting_frame()

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            time.sleep(1.0 / self.fps)


video_stream_service = VideoStreamService()
