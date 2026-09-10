"""Image processing and validation utilities."""
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Tuple
from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageDraw, ImageFont
from app.config import settings
from app.schemas.models import DefectItem
from app.utils.logger import logger

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/pjpeg"}
MACHINE_ID_REGEX = re.compile(r"^[A-Za-z0-9_\-]+$")


def validate_machine_id(machine_id: str) -> str:
    """Validate machine_id format (alphanumeric, hyphens, underscores)."""
    if not machine_id or not machine_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="machine_id cannot be empty."
        )
    clean_id = machine_id.strip()
    if not MACHINE_ID_REGEX.match(clean_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid machine_id '{clean_id}'. Must only contain alphanumeric characters, hyphens, or underscores."
        )
    return clean_id


async def validate_and_save_upload(file: UploadFile) -> Tuple[Path, bytes, int, int]:
    """
    Validates uploaded file MIME type, file extension, and file size.
    Saves the file to settings.UPLOADS_DIR.
    Returns: (saved_path, image_bytes, width, height)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename."
        )

    # Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Check content type if supplied
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported MIME type '{file.content_type}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
        )

    # Determine 413 status code cleanly
    http_413 = getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413)

    # Read contents with size check
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=http_413,
            detail=f"File size ({len(content) / (1024 * 1024):.2f}MB) exceeds limit of {settings.MAX_IMAGE_SIZE_MB}MB."
        )


    # Verify actual image integrity using PIL
    try:
        from io import BytesIO
        with Image.open(BytesIO(content)) as img:
            img.verify()
        # Re-open to read width and height after verify()
        with Image.open(BytesIO(content)) as img:
            width, height = img.size
    except Exception as exc:
        logger.warning(f"Corrupted image upload attempt: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file is not a valid image or is corrupted: {str(exc)}"
        )

    # Save to uploads directory
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_suffix = uuid.uuid4().hex[:8]
    safe_filename = f"{timestamp_prefix}_{unique_suffix}{ext}"
    destination = settings.UPLOADS_DIR / safe_filename

    with open(destination, "wb") as f:
        f.write(content)

    logger.info(f"Saved uploaded image: {destination} ({width}x{height}, {len(content)} bytes)")
    return destination, content, width, height


def annotate_image(
    image_path: Path,
    defects: List[DefectItem],
    output_dir: Path
) -> Path:
    """
    Draws bounding boxes and labels for each detected defect and saves to output_dir.
    Colors boxes according to defect severity.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    annotated_filename = f"annotated_{image_path.name}"
    annotated_path = output_dir / annotated_filename

    with Image.open(image_path).convert("RGB") as img:
        draw = ImageDraw.Draw(img)

        # Color mapping by severity
        severity_colors = {
            "CRITICAL": (220, 38, 38),  # Red
            "HIGH": (234, 88, 12),      # Orange
            "MEDIUM": (202, 138, 4),    # Amber/Yellow
            "LOW": (37, 99, 235),       # Blue
        }

        # Try to load default font
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None

        for defect in defects:
            box = defect.bounding_box
            color = severity_colors.get(defect.severity.value, (255, 0, 0))
            
            # Draw rectangle (outline thickness 3)
            draw.rectangle(
                [(box.x1, box.y1), (box.x2, box.y2)],
                outline=color,
                width=3
            )

            label = f"{defect.type} ({defect.confidence:.2f}) [{defect.severity.value}]"
            # Draw label background
            text_bbox = draw.textbbox((box.x1, max(0, box.y1 - 16)), label, font=font) if font else (box.x1, max(0, box.y1 - 16), box.x1 + 100, box.y1)
            draw.rectangle(text_bbox, fill=color)
            draw.text((box.x1 + 2, max(0, box.y1 - 16)), label, fill=(255, 255, 255), font=font)

        img.save(annotated_path, "JPEG", quality=90)

    logger.info(f"Saved annotated image: {annotated_path}")
    return annotated_path
