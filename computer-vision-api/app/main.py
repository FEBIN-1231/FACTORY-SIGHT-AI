"""FastAPI application entrypoint for SmartShop Computer Vision API."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import router as api_router
from app.config import settings
from app.services.vision_service import vision_service
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager to handle startup and shutdown tasks."""
    logger.info("Initializing SmartShop Computer Vision API...")
    logger.info(f"Environment: DEMO_MODE={settings.DEMO_MODE}, MODEL_PATH={settings.MODEL_PATH}")

    # Ensure required runtime directories exist
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    settings.ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)

    # Load YOLO model once at startup
    vision_service.load_model()

    logger.info("SmartShop Computer Vision API is ready to accept requests.")
    yield

    logger.info("Shutting down SmartShop Computer Vision API...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-grade Computer Vision API for defect detection in manufacturing equipment "
        "and automated alerting to the SNS Agent Workbench."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all unhandled exception handler ensuring consistent JSON error responses."""
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing the request.",
            "detail": str(exc) if settings.DEBUG else None,
        }
    )


# Include API routes
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
