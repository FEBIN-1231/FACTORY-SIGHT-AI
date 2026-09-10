"""Configuration settings and severity rules for SmartShop Computer Vision API."""
import os
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


SEVERITY_PRIORITY: Dict[SeverityLevel, int] = {
    SeverityLevel.CRITICAL: 4,
    SeverityLevel.HIGH: 3,
    SeverityLevel.MEDIUM: 2,
    SeverityLevel.LOW: 1,
}

# Standard defect classes supported by the trained YOLO defect model
DEFECT_CLASSES: List[str] = [
    "crack",
    "hole",
    "rust",
    "scratch",
    "scrach",
    "dent",
    "surface_defect",
    "oil_leak",
    "broken_component",
    "missing_component",
    "misalignment",
]

# Single source of truth for severity determination: (min_confidence, SeverityLevel)
# Evaluated in descending order of min_confidence threshold
DEFECT_SEVERITY_RULES: Dict[str, List[Tuple[float, SeverityLevel]]] = {
    "crack": [
        (0.70, SeverityLevel.HIGH),
        (0.00, SeverityLevel.MEDIUM),
    ],
    "hole": [
        (0.70, SeverityLevel.HIGH),
        (0.00, SeverityLevel.MEDIUM),
    ],
    "rust": [
        (0.70, SeverityLevel.MEDIUM),
        (0.00, SeverityLevel.LOW),
    ],
    "scratch": [
        (0.70, SeverityLevel.MEDIUM),
        (0.00, SeverityLevel.LOW),
    ],
    "scrach": [
        (0.70, SeverityLevel.MEDIUM),
        (0.00, SeverityLevel.LOW),
    ],
    "dent": [
        (0.70, SeverityLevel.HIGH),
        (0.00, SeverityLevel.MEDIUM),
    ],
    "oil_leak": [
        (0.85, SeverityLevel.HIGH),
        (0.00, SeverityLevel.MEDIUM),
    ],
    "broken_component": [
        (0.70, SeverityLevel.CRITICAL),
        (0.00, SeverityLevel.HIGH),
    ],
    "surface_defect": [
        (0.80, SeverityLevel.MEDIUM),
        (0.00, SeverityLevel.LOW),
    ],
    "missing_component": [
        (0.70, SeverityLevel.HIGH),
        (0.00, SeverityLevel.MEDIUM),
    ],
    "misalignment": [
        (0.75, SeverityLevel.HIGH),
        (0.00, SeverityLevel.MEDIUM),
    ],
}


def calculate_severity(defect_type: str, confidence: float) -> SeverityLevel:
    """Calculate severity for a defect type and confidence score based on rules."""
    rules = DEFECT_SEVERITY_RULES.get(defect_type)
    if rules:
        for min_conf, sev in rules:
            if confidence >= min_conf:
                return sev
    # Default fallback for new/extensible classes
    if confidence >= 0.85:
        return SeverityLevel.HIGH
    elif confidence >= 0.70:
        return SeverityLevel.MEDIUM
    return SeverityLevel.LOW


def calculate_highest_severity(severities: List[SeverityLevel]) -> SeverityLevel:
    """Determine highest severity according to CRITICAL > HIGH > MEDIUM > LOW priority."""
    if not severities:
        return SeverityLevel.LOW
    return max(severities, key=lambda s: SEVERITY_PRIORITY.get(s, 0))


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "SmartShop Computer Vision API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DEMO_MODE: bool = Field(default=False, description="Enable simulated detections")
    MODEL_PATH: str = Field(default="defect_best.pt", description="Path to YOLOv8 weights")
    CONFIDENCE_THRESHOLD: float = Field(default=0.25, ge=0.0, le=1.0, description="Minimum detection confidence")
    SAVE_ANNOTATED_IMAGES: bool = Field(default=True, description="Save annotated detection images")
    MAX_IMAGE_SIZE_MB: int = Field(default=10, gt=0, description="Max allowed upload image size in MB")

    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    ANNOTATED_DIR: Path = BASE_DIR / "annotated"

    # SNS Agent Workbench Webhook Configuration
    SNS_WEBHOOK_URL: Optional[str] = Field(default=None, description="SNS Agent Workbench Webhook endpoint")
    SNS_TIMEOUT_SECONDS: float = Field(default=15.0, gt=0, description="HTTP timeout for SNS webhook POST")
    SNS_MAX_RETRIES: int = Field(default=3, ge=0, description="Maximum retry attempts for SNS webhook POST")


settings = Settings()
