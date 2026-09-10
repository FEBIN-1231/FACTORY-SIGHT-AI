"""Structured logging configuration for SmartShop Computer Vision API."""
import logging
import sys
from typing import Optional


def setup_logger(name: str = "smartshop_cv", level: Optional[str] = None) -> logging.Logger:
    """Configures and returns a formatted structured logger."""
    log_level = getattr(logging, (level or "INFO").upper(), logging.INFO)
    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Avoid duplicate handlers if setup is called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    logger.propagate = False
    return logger


logger = setup_logger()
