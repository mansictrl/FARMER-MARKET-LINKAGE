import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all SQLAlchemy models are registered
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("farmer_market")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure local storage directory exists
    os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
    
    # Auto-create tables for SQLite / development
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Database table verification warning: {str(e)}")

    yield
    # Shutdown logic
    logger.info("Shutting down Farmer Market Application.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="End-to-end Farmer Market Linkage and Price Discovery System connecting farmers, FPOs, and buyers.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """System health check endpoint verifying database connectivity and API uptime."""
    db_status = "CONNECTED"
    try:
        with engine.connect() as conn:
            pass
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    return {
        "status": "HEALTHY" if db_status == "CONNECTED" else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "demo_mode": settings.DEMO_MODE
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR
    }


# Include all v1 endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)
