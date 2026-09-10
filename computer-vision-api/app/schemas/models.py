"""Pydantic schemas and response models for SmartShop Computer Vision API."""
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from app.config import SeverityLevel


class InspectionStatus(str, Enum):
    DEFECT_DETECTED = "DEFECT_DETECTED"
    NORMAL = "NORMAL"


class BoundingBox(BaseModel):
    """2D Bounding box pixel coordinates (top-left, bottom-right)."""
    x1: int = Field(..., description="Top-left X coordinate")
    y1: int = Field(..., description="Top-left Y coordinate")
    x2: int = Field(..., description="Bottom-right X coordinate")
    y2: int = Field(..., description="Bottom-right Y coordinate")


class DefectItem(BaseModel):
    """Detailed defect detection item including bounding box."""
    type: str = Field(..., description="Defect class (e.g., crack, oil_leak, rust)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    severity: SeverityLevel = Field(..., description="Computed severity level")
    bounding_box: BoundingBox = Field(..., description="Bounding box on original image")


class DetectionResponse(BaseModel):
    """Structured response returned by POST /detect."""
    machine_id: str = Field(..., description="Identifier of the inspected machine")
    inspection_status: InspectionStatus = Field(..., description="DEFECT_DETECTED or NORMAL")
    defect_detected: bool = Field(..., description="True if one or more defects were found")
    highest_severity: SeverityLevel = Field(..., description="Maximum severity across all detections")
    total_defects: int = Field(..., ge=0, description="Total count of detected defects")
    defects: List[DefectItem] = Field(default_factory=list, description="List of detected defects")
    image_processed: bool = Field(default=True, description="Indicates image was successfully processed")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of inspection"
    )
    is_simulated: bool = Field(
        default=False,
        description="Explicit flag indicating simulated demo detection (DEMO_MODE=true)"
    )
    annotated_image_path: Optional[str] = Field(
        default=None,
        description="Relative path to saved annotated image if enabled"
    )
    sns_delivery_status: Optional[str] = Field(
        default=None,
        description="Delivery status to SNS Agent Workbench Webhook"
    )


class SNSDefectItem(BaseModel):
    """Simplified defect item without image bounding box coordinates for SNS payload."""
    type: str = Field(..., description="Defect class")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    severity: SeverityLevel = Field(..., description="Severity level")


class SNSPayload(BaseModel):
    """Payload sent to SNS Agent Workbench Webhook."""
    source: str = Field(default="computer_vision", description="Event producer source")
    machine_id: str = Field(..., description="Machine identifier")
    inspection_status: InspectionStatus = Field(..., description="Inspection outcome")
    defect_detected: bool = Field(..., description="Defect flag")
    highest_severity: SeverityLevel = Field(..., description="Highest severity level")
    total_defects: int = Field(..., ge=0, description="Count of detected defects")
    defects: List[SNSDefectItem] = Field(default_factory=list, description="List of defects without binaries")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")


class HealthResponse(BaseModel):
    """Response schema for GET /health."""
    status: str = Field(..., example="healthy")
    model_loaded: bool = Field(..., description="Whether YOLO model is loaded in memory")
    demo_mode: bool = Field(..., description="Whether demo mode simulation is enabled")


class RootResponse(BaseModel):
    """Response schema for GET /."""
    service: str = Field(..., example="SmartShop Computer Vision API")
    status: str = Field(..., example="running")
