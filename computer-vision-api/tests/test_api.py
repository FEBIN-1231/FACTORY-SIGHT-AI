import os
import sys
from io import BytesIO
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


from fastapi.testclient import TestClient
from PIL import Image
from app.config import settings
from app.main import app
from app.schemas.models import SeverityLevel


def create_test_image(format="JPEG", size=(300, 300), color=(128, 128, 128)) -> bytes:
    """Helper to create dummy valid image bytes."""
    buf = BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


def test_root_endpoint():
    """Verify GET / returns exact shape."""
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "service": "SmartShop Computer Vision API",
        "status": "running"
    }


def test_health_endpoint():
    """Verify GET /health returns expected schema and demo mode status."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data
    assert "demo_mode" in data


def test_detect_demo_mode_success():
    """Verify POST /detect produces schema-compliant simulated detection in demo mode."""
    client = TestClient(app)
    img_bytes = create_test_image(format="JPEG", size=(640, 480))
    
    response = client.post(
        "/detect",
        data={"machine_id": "M-03"},
        files={"file": ("test_gear.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["machine_id"] == "M-03"
    assert data["inspection_status"] == "DEFECT_DETECTED"
    assert data["defect_detected"] is True
    assert data["highest_severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert data["total_defects"] > 0
    assert len(data["defects"]) == data["total_defects"]
    assert data["image_processed"] is True
    assert "timestamp" in data
    assert data["is_simulated"] is True
    
    # Check defect structure
    first_defect = data["defects"][0]
    assert "type" in first_defect
    assert "confidence" in first_defect
    assert "severity" in first_defect
    assert "bounding_box" in first_defect
    assert all(k in first_defect["bounding_box"] for k in ["x1", "y1", "x2", "y2"])


def test_detect_invalid_file_extension():
    """Verify rejection of non-jpg/png files with HTTP 415."""
    client = TestClient(app)
    fake_txt = b"This is a text file, not an image."
    response = client.post(
        "/detect",
        data={"machine_id": "M-03"},
        files={"file": ("test.txt", fake_txt, "text/plain")}
    )
    assert response.status_code == 415
    assert "Unsupported file format" in response.json()["detail"]


def test_detect_corrupted_image():
    """Verify rejection of corrupted image bytes with HTTP 400."""
    client = TestClient(app)
    corrupt_bytes = b"\xFF\xD8\xFF\xE0corruptedimagecontentnotvalid"
    response = client.post(
        "/detect",
        data={"machine_id": "M-03"},
        files={"file": ("corrupt.jpg", corrupt_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower()


def test_detect_invalid_machine_id():
    """Verify validation on empty or special-character machine IDs."""
    client = TestClient(app)
    img_bytes = create_test_image()
    
    # Empty machine ID
    response = client.post(
        "/detect",
        data={"machine_id": "   "},
        files={"file": ("test.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 400

    # Special characters
    response2 = client.post(
        "/detect",
        data={"machine_id": "M-03; DROP TABLE"},
        files={"file": ("test.jpg", img_bytes, "image/jpeg")}
    )
    assert response2.status_code == 400


def test_detect_oversized_file():
    """Verify rejection of files larger than MAX_IMAGE_SIZE_MB."""
    client = TestClient(app)
    orig_limit = settings.MAX_IMAGE_SIZE_MB
    try:
        # Temporarily set max limit to 0 MB (will reject any non-empty image)
        settings.MAX_IMAGE_SIZE_MB = 0
        img_bytes = create_test_image()
        response = client.post(
            "/detect",
            data={"machine_id": "M-03"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")}
        )
        assert response.status_code == 413
        assert "exceeds limit" in response.json()["detail"]
    finally:
        settings.MAX_IMAGE_SIZE_MB = orig_limit


def test_demo_mode_false_with_missing_model():
    """Verify DEMO_MODE=false fails gracefully with HTTP 503 if weights are missing."""
    from app.services.vision_service import vision_service
    client = TestClient(app)
    orig_demo = settings.DEMO_MODE
    orig_model = vision_service.model
    orig_loaded = vision_service.model_loaded
    try:
        settings.DEMO_MODE = False
        vision_service.model = None
        vision_service.model_loaded = False
        vision_service.load_error = "Model weights file not found at 'models/best.pt'."

        img_bytes = create_test_image()
        response = client.post(
            "/detect",
            data={"machine_id": "M-03"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")}
        )
        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"].lower()
    finally:
        settings.DEMO_MODE = orig_demo
        vision_service.model = orig_model
        vision_service.model_loaded = orig_loaded


def test_sns_failure_does_not_break_detect():
    """Verify failing SNS webhook does not throw unhandled exception to client."""
    client = TestClient(app)
    orig_url = settings.SNS_WEBHOOK_URL
    orig_retries = settings.SNS_MAX_RETRIES
    orig_timeout = settings.SNS_TIMEOUT_SECONDS
    try:
        # Point to unreachable port/IP with 0 retries and low timeout for fast test
        settings.SNS_WEBHOOK_URL = "http://127.0.0.1:59999/webhook/fake"
        settings.SNS_MAX_RETRIES = 0
        settings.SNS_TIMEOUT_SECONDS = 0.5

        img_bytes = create_test_image()
        response = client.post(
            "/detect",
            data={"machine_id": "M-03"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["defect_detected"] is True
        assert data["sns_delivery_status"] in ["FAILED_AFTER_RETRIES", "SKIPPED_NOT_CONFIGURED"]
    finally:
        settings.SNS_WEBHOOK_URL = orig_url
        settings.SNS_MAX_RETRIES = orig_retries
        settings.SNS_TIMEOUT_SECONDS = orig_timeout


def test_sns_retry_mechanism():
    """Verify SNS service executes retry attempts on connection error."""
    client = TestClient(app)
    orig_url = settings.SNS_WEBHOOK_URL
    orig_retries = settings.SNS_MAX_RETRIES
    orig_timeout = settings.SNS_TIMEOUT_SECONDS
    try:
        # 2 retries on non-existent local port
        settings.SNS_WEBHOOK_URL = "http://127.0.0.1:59998/sns/test"
        settings.SNS_MAX_RETRIES = 2
        settings.SNS_TIMEOUT_SECONDS = 0.3

        img_bytes = create_test_image()
        response = client.post(
            "/detect",
            data={"machine_id": "M-03"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sns_delivery_status"] == "FAILED_AFTER_RETRIES"
    finally:
        settings.SNS_WEBHOOK_URL = orig_url
        settings.SNS_MAX_RETRIES = orig_retries
        settings.SNS_TIMEOUT_SECONDS = orig_timeout


if __name__ == "__main__":
    import sys
    print("Running test suite...")
    test_functions = [
        test_root_endpoint,
        test_health_endpoint,
        test_detect_demo_mode_success,
        test_detect_invalid_file_extension,
        test_detect_corrupted_image,
        test_detect_invalid_machine_id,
        test_detect_oversized_file,
        test_demo_mode_false_with_missing_model,
        test_sns_failure_does_not_break_detect,
        test_sns_retry_mechanism,
    ]

    passed = 0
    failed = 0
    for fn in test_functions:
        try:
            fn()
            print(f"  PASS: {fn.__name__}")
            passed += 1
        except Exception as exc:
            print(f"  FAIL: {fn.__name__} - {exc}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed.")
    sys.exit(0 if failed == 0 else 1)

