"""FastAPI API routes for SmartShop Computer Vision Module."""
from fastapi import APIRouter, File, Form, Request, UploadFile, status
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
import numpy as np
from app.config import settings
from app.schemas.models import (
    DetectionResponse,
    HealthResponse,
    RootResponse,
    SNSDefectItem,
    SNSPayload,
)
from app.services.sns_service import sns_service
from app.services.vision_service import vision_service
from app.services.video_stream_service import video_stream_service
from app.utils.image_utils import validate_and_save_upload, validate_machine_id
from app.utils.logger import logger

router = APIRouter()

DEFECT_HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defect Detection Integration</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #0b0f19;
            color: #f1f5f9;
            margin: 0;
            padding: 24px;
        }
        h2, h3 {
            margin-top: 0;
            color: #38bdf8;
        }
        .defect-container {
            display: flex;
            gap: 24px;
            align-items: flex-start;
            flex-wrap: wrap;
        }
        .video-box {
            background: #1e293b;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #334155;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
        }
        .video-box img {
            border: 2px solid #0284c7;
            border-radius: 8px;
            width: 640px;
            max-width: 100%;
            height: auto;
            display: block;
            background: #020617;
        }
        .status-box {
            background: #1e293b;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #334155;
            min-width: 280px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
        }
        ul#defect-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        ul#defect-list li {
            padding: 10px 14px;
            margin-bottom: 8px;
            border-radius: 6px;
            background: #0f172a;
            border-left: 4px solid #38bdf8;
            font-size: 14px;
        }
        ul#defect-list li.defect-item {
            border-left-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }
        ul#defect-list li.nominal-item {
            border-left-color: #10b981;
            background: rgba(16, 185, 129, 0.1);
        }
    </style>
</head>
<body>
    <h2>Live Machine Defect Detection Feed</h2>
    <div class="defect-container">
        <!-- Live Video Stream from FastAPI Backend -->
        <div class="video-box">
            <h3>Live Inspection Feed</h3>
            <img src="/video_feed" alt="Live Defect Stream" />
        </div>

        <!-- Real-time JSON Telemetry Sidebar -->
        <div class="status-box">
            <h3>Detection Status</h3>
            <ul id="defect-list">
                <li>Connecting to server...</li>
            </ul>
        </div>
    </div>

    <script>
        // Fetch detection telemetry every second
        setInterval(async () => {
            try {
                let response = await fetch('/detect_status');
                let data = await response.json();
                let listElement = document.getElementById('defect-list');
                
                if (!data.detections || data.detections.length === 0) {
                    listElement.innerHTML = '<li class="nominal-item">No defects detected</li>';
                } else {
                    let html = '';
                    data.detections.forEach(item => {
                        let className = (item.class || item.type || item.defectType || 'defect').toUpperCase();
                        let conf = item.confidence || '';
                        html += `<li class="defect-item"><strong>${className}</strong>: ${conf}%</li>`;
                    });
                    listElement.innerHTML = html;
                }
            } catch (err) {
                console.error('Failed to fetch defect status:', err);
                document.getElementById('defect-list').innerHTML = '<li style="color: #ef4444;">Server offline</li>';
            }
        }, 1000);
    </script>
</body>
</html>
"""


@router.get(
    "/",
    response_model=RootResponse,
    summary="Root service status",
    tags=["General"]
)
async def get_root(request: Request):
    """Returns HTML live feed if requested by browser or JSON root response."""
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return HTMLResponse(content=DEFECT_HTML_PAGE)
    return RootResponse(
        service=settings.APP_NAME,
        status="running"
    )


@router.get(
    "/live",
    response_class=HTMLResponse,
    summary="Live Inspection Feed HTML Interface",
    tags=["Computer Vision"]
)
async def get_live_page():
    """Returns the Defect Detection HTML page with embedded live video stream and real-time polling."""
    return HTMLResponse(content=DEFECT_HTML_PAGE)


@router.get(
    "/switch_camera",
    summary="Switch backend camera index (0 or 1)",
    tags=["Computer Vision"]
)
async def switch_camera(index: int = 1):
    """Switches the active camera index between 0 and 1."""
    video_stream_service.set_camera_index(index)
    return {"status": "ok", "camera_index": index}


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["Health"]
)
async def get_health():
    """
    Returns service health status, model loading state, and whether demo mode is active.
    """
    return HealthResponse(
        status="healthy",
        model_loaded=vision_service.model_loaded,
        demo_mode=settings.DEMO_MODE,
    )


@router.get(
    "/video_feed",
    summary="Live MJPEG video stream of inspection camera",
    tags=["Computer Vision"]
)
async def get_video_feed():
    """
    Streams a real-time MJPEG video feed for live defect visual inspection.
    Compatible with standard HTML <img> tags (<img src="/video_feed" />).
    """
    return StreamingResponse(
        video_stream_service.generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get(
    "/snapshot",
    summary="Get single current JPEG frame from live camera",
    tags=["Computer Vision"]
)
async def get_snapshot():
    """Returns a single JPEG snapshot of the current live camera frame."""
    import cv2
    from fastapi import Response
    raw = video_stream_service.get_latest_raw_frame()
    if raw is not None:
        ret, buf = cv2.imencode(".jpg", raw, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        if ret:
            return Response(content=buf.tobytes(), media_type="image/jpeg")
    jpeg = video_stream_service.get_latest_jpeg()
    if jpeg is not None:
        return Response(content=jpeg, media_type="image/jpeg")
    return Response(content=video_stream_service._draw_connecting_frame(), media_type="image/jpeg")


@router.post(
    "/scan_current_frame",
    response_model=DetectionResponse,
    summary="Capture and inspect current camera frame with YOLO defect detection",
    tags=["Computer Vision"]
)
async def scan_current_frame(
    machine_id: str = Form(default="M-03", description="Target machine identifier")
):
    """
    Captures the current live camera frame in memory, runs YOLO defect detection,
    saves artifacts, and returns structured inspection results.
    """
    import cv2, uuid
    from datetime import datetime
    clean_machine_id = validate_machine_id(machine_id)
    raw = video_stream_service.get_latest_raw_frame()
    
    if raw is None:
        raw = np.zeros((480, 640, 3), dtype=np.uint8)

    h, w = raw.shape[:2]
    timestamp_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_suffix = uuid.uuid4().hex[:8]
    safe_filename = f"scan_{timestamp_prefix}_{unique_suffix}.jpg"
    destination = settings.UPLOADS_DIR / safe_filename
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(destination), raw)

    detection_result = vision_service.detect(
        image_path=destination,
        machine_id=clean_machine_id,
        img_width=w,
        img_height=h
    )

    sns_defects = [
        SNSDefectItem(
            type=defect.type,
            confidence=defect.confidence,
            severity=defect.severity,
        )
        for defect in detection_result.defects
    ]

    sns_payload = SNSPayload(
        source="computer_vision",
        machine_id=detection_result.machine_id,
        inspection_status=detection_result.inspection_status,
        defect_detected=detection_result.defect_detected,
        highest_severity=detection_result.highest_severity,
        total_defects=detection_result.total_defects,
        defects=sns_defects,
        timestamp=detection_result.timestamp,
    )

    delivery_status = await sns_service.forward_detection(sns_payload)
    detection_result.sns_delivery_status = delivery_status
    return detection_result


@router.get(
    "/detect_status",
    summary="Real-time defect detections telemetry",
    tags=["Computer Vision"]
)
async def get_detect_status():
    """
    Returns real-time status of current live detections, coordinates, and classification confidence.
    """
    return video_stream_service.get_status()


@router.post(
    "/detect",
    response_model=DetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect defects on machine image",
    tags=["Computer Vision"]
)
async def detect_defects(
    machine_id: str = Form(..., description="Target machine identifier (e.g. M-03)"),
    file: UploadFile = File(..., description="Image file (.jpg, .jpeg, or .png)")
):
    """
    Accepts an uploaded image and machine ID, performs image validation, executes
    either real or demo defect detection, generates severity metrics, saves artifacts,
    and pushes structured alerts to the SNS Agent Workbench webhook.
    """
    # 1. Validate machine_id
    clean_machine_id = validate_machine_id(machine_id)

    # 2. Validate image type, dimensions, size and save to uploads/
    saved_path, _, width, height = await validate_and_save_upload(file)

    # 3. Execute detection pipeline (demo or YOLO production)
    detection_result = vision_service.detect(
        image_path=saved_path,
        machine_id=clean_machine_id,
        img_width=width,
        img_height=height
    )

    # 4. Prepare SNS Webhook payload
    sns_defects = [
        SNSDefectItem(
            type=defect.type,
            confidence=defect.confidence,
            severity=defect.severity,
        )
        for defect in detection_result.defects
    ]

    sns_payload = SNSPayload(
        source="computer_vision",
        machine_id=detection_result.machine_id,
        inspection_status=detection_result.inspection_status,
        defect_detected=detection_result.defect_detected,
        highest_severity=detection_result.highest_severity,
        total_defects=detection_result.total_defects,
        defects=sns_defects,
        timestamp=detection_result.timestamp,
    )

    # 5. Forward to SNS Agent Workbench Webhook asynchronously
    delivery_status = await sns_service.forward_detection(sns_payload)
    detection_result.sns_delivery_status = delivery_status

    logger.info(
        f"Detection completed for {clean_machine_id}: "
        f"status={detection_result.inspection_status.value}, "
        f"defects={detection_result.total_defects}, "
        f"severity={detection_result.highest_severity.value}, "
        f"sns_status={delivery_status}"
    )

    return detection_result
