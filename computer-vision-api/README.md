# SmartShop Computer Vision API (`computer-vision-api`)

Production-grade, self-contained Computer Vision module built with **FastAPI** and **YOLOv8** to detect machine and manufacturing defects from visual inspections, determine defect severity, and forward structured event alerts to the **SNS Agent Workbench Webhook**.

---

## Architecture Overview

```
Camera / Client Upload (POST /detect)
  │
  ├── 1. Validation Layer (MIME verification, dimensions, file size <= 10MB, machine_id pattern)
  │
  ├── 2. Computer Vision Pipeline (services/vision_service.py)
  │      ├── DEMO_MODE=true  ──> Simulated realistic defect detection (clearly marked)
  │      └── DEMO_MODE=false ──> Ultralytics YOLOv8 real inference (models/best.pt)
  │
  ├── 3. Single-Source Severity Engine (config.py)
  │      ├── Rule evaluation (crack >= 0.80 -> HIGH, broken_component >= 0.70 -> CRITICAL, etc.)
  │      └── Global Priority: CRITICAL > HIGH > MEDIUM > LOW
  │
  ├── 4. Visual Artifact Annotation (annotated/)
  │      └── Color-coded bounding box rendering (Red/Orange/Yellow/Blue)
  │
  └── 5. Webhook Forwarder (services/sns_service.py)
         └── Non-blocking async POST to SNS_WEBHOOK_URL with exponential backoff retries
```

---

## Directory Layout

```
computer-vision-api/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py                    # Application lifespan, CORS, and exception handling
  │   ├── config.py                  # Pydantic BaseSettings and severity rules
  │   ├── api/
  │   │   ├── __init__.py
  │   │   └── routes.py              # Endpoints: GET /, GET /health, POST /detect
  │   ├── services/
  │   │   ├── __init__.py
  │   │   ├── vision_service.py      # Startup model loader and inference branching
  │   │   └── sns_service.py         # Resilient webhook dispatcher with retries
  │   ├── schemas/
  │   │   ├── __init__.py
  │   │   └── models.py              # Pydantic schemas for detection and SNS payload
  │   └── utils/
  │       ├── __init__.py
  │       ├── image_utils.py         # File validation and bounding box rendering
  │       └── logger.py              # Structured logging
  ├── models/
  │   ├── .gitkeep
  │   └── best.pt                    # Place trained YOLO weights here
  ├── uploads/                       # Temporary incoming uploads
  ├── annotated/                     # Output annotated inspection images
  ├── requirements.txt               # Pinned dependencies
  ├── .env.example                   # Environment template
  ├── .gitignore
  └── README.md
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.10+ (Recommended: Python 3.11)
- `pip` and `virtualenv`

### 2. Create Virtual Environment
```bash
cd computer-vision-api

# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## Environment Configuration

Copy `.env.example` to create your active `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DEMO_MODE` | `true` | `true` uses simulated detections; `false` runs genuine YOLOv8 inference. |
| `MODEL_PATH` | `models/best.pt` | Path to your trained YOLOv8 weights file. |
| `CONFIDENCE_THRESHOLD` | `0.50` | Minimum detection confidence score (0.0 - 1.0). |
| `SAVE_ANNOTATED_IMAGES`| `true` | When true, renders bounding boxes and saves images to `annotated/`. |
| `MAX_IMAGE_SIZE_MB` | `10` | Maximum file upload size allowed. |
| `SNS_WEBHOOK_URL` | `""` | Target webhook URL of your SNS Agent Workbench workflow. |
| `SNS_TIMEOUT_SECONDS` | `15` | Timeout for the webhook HTTP request. |
| `SNS_MAX_RETRIES` | `3` | Exponential backoff retry attempts on webhook network failures. |

---

## Running Locally

Start the development server with hot-reload enabled:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Endpoints

### 1. `GET /`
Basic service discovery.
```bash
curl -X GET http://127.0.0.1:8000/
```
**Response:**
```json
{
  "service": "SmartShop Computer Vision API",
  "status": "running"
}
```

### 2. `GET /health`
Verifies service health, model status, and operating mode.
```bash
curl -X GET http://127.0.0.1:8000/health
```
**Response:**
```json
{
  "status": "healthy",
  "model_loaded": false,
  "demo_mode": true
}
```

### 3. `POST /detect`
Uploads an image for defect inspection.

#### Request (Multipart Form Data):
- `machine_id` (string, required): e.g. `M-03`
- `file` (binary, required): Image file (`.jpg`, `.jpeg`, `.png`)

#### Example `curl` Call:
```bash
curl -X POST "http://127.0.0.1:8000/detect" \
  -F "machine_id=M-03" \
  -F "file=@sample_gear.jpg;type=image/jpeg"
```

#### Example Response (`DEMO_MODE=true` or Defect Found):
```json
{
  "machine_id": "M-03",
  "inspection_status": "DEFECT_DETECTED",
  "defect_detected": true,
  "highest_severity": "HIGH",
  "total_defects": 2,
  "defects": [
    {
      "type": "crack",
      "confidence": 0.94,
      "severity": "HIGH",
      "bounding_box": {
        "x1": 120,
        "y1": 80,
        "x2": 300,
        "y2": 250
      }
    },
    {
      "type": "surface_defect",
      "confidence": 0.82,
      "severity": "MEDIUM",
      "bounding_box": {
        "x1": 440,
        "y1": 350,
        "x2": 640,
        "y2": 525
      }
    }
  ],
  "image_processed": true,
  "timestamp": "2026-09-02T07:30:00.000000+00:00",
  "is_simulated": true,
  "annotated_image_path": "annotated/annotated_20260902_073000_a1b2c3d4.jpg",
  "sns_delivery_status": "DELIVERED"
}
```

#### Normal Response (No Defects Detected):
```json
{
  "machine_id": "M-03",
  "inspection_status": "NORMAL",
  "defect_detected": false,
  "highest_severity": "LOW",
  "total_defects": 0,
  "defects": [],
  "image_processed": true,
  "timestamp": "2026-09-02T07:30:00.000000+00:00",
  "is_simulated": false,
  "annotated_image_path": null,
  "sns_delivery_status": "SKIPPED_NOT_CONFIGURED"
}
```

---

## Severity Engine Rules

Severity is evaluated from a single source of truth (`app/config.py`):
- `crack` ≥ 0.80 ➔ `HIGH`
- `oil_leak` ≥ 0.85 ➔ `HIGH`
- `broken_component` ≥ 0.70 ➔ `CRITICAL`
- `rust` ≥ 0.75 ➔ `MEDIUM`
- `surface_defect` ≥ 0.80 ➔ `MEDIUM`
- `missing_component` ≥ 0.70 ➔ `HIGH`
- `misalignment` ≥ 0.75 ➔ `HIGH`

The `highest_severity` is prioritized as:
$$\text{CRITICAL} > \text{HIGH} > \text{MEDIUM} > \text{LOW}$$

---

## Switching Between Demo Mode and Production

### Demo Mode (`DEMO_MODE=true`):
- Simulated, deterministic detections.
- Allows end-to-end testing before trained weights exist.
- Does not crash if `models/best.pt` is absent.

### Production Mode (`DEMO_MODE=false`):
1. Train or download your YOLOv8 weights file.
2. Place the weights at `models/best.pt` (or set `MODEL_PATH`).
3. Set `DEMO_MODE=false` in `.env`.
4. Restart the service. The model loads into memory at startup.
5. If the model file is missing or corrupted, the service fails gracefully with HTTP 503 instead of crashing.

---

## SNS Agent Workbench Integration

When an image is inspected, an alert payload (without image binary) is sent to `SNS_WEBHOOK_URL`:

```json
{
  "source": "computer_vision",
  "machine_id": "M-03",
  "inspection_status": "DEFECT_DETECTED",
  "defect_detected": true,
  "highest_severity": "HIGH",
  "total_defects": 2,
  "defects": [
    {
      "type": "crack",
      "confidence": 0.94,
      "severity": "HIGH"
    },
    {
      "type": "surface_defect",
      "confidence": 0.82,
      "severity": "MEDIUM"
    }
  ],
  "timestamp": "2026-09-02T07:30:00.000000+00:00"
}
```

### Webhook Resilience:
- Webhook delivery is non-blocking to the client.
- If the endpoint times out or returns an error, `SNSService` automatically performs exponential backoff retries.
- Sensitive authentication headers/query tokens are never logged.
- Webhook failure does not break the `/detect` API response.

---

## Deployment Notes for Render

1. **Service Type**: Web Service
2. **Environment**: Python 3
3. **Build Command**:
   ```bash
   pip install --upgrade pip && pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. **Environment Variables**:
   - `DEMO_MODE`: `true` (or `false` if weights are stored in Git LFS or external bucket)
   - `MODEL_PATH`: `models/best.pt`
   - `SNS_WEBHOOK_URL`: `<your-sns-workbench-webhook-url>`
   - `PYTHONUNBUFFERED`: `1`
