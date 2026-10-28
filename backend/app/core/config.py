import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Farmer Market Linkage & Price Discovery System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agrimarket-super-secure-production-ready-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    # Defaults to SQLite for local standalone development & testing, 
    # and PostgreSQL when in Docker Compose or when DATABASE_URL is set.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./farmer_market.db"
    )

    # Message Queue & Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    # Object Storage (MinIO / S3)
    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "local")  # 'local', 'minio', or 's3'
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "farmer-market-docs")
    LOCAL_STORAGE_DIR: str = os.getenv("LOCAL_STORAGE_DIR", "./storage_uploads")

    # Payment Gateway (Razorpay test mode)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mock_farmer_market_id")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock_razorpay_secret_key_demo")
    PAYMENT_MODE: str = os.getenv("PAYMENT_MODE", "test")

    # External APIs
    AGMARKNET_API_KEY: str = os.getenv("AGMARKNET_API_KEY", "")
    AGMARKNET_BASE_URL: str = os.getenv("AGMARKNET_BASE_URL", "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:80",
        "http://localhost:8080"
    ]

    # Application flags
    DEMO_MODE: bool = True  # Provides realistic data fallback when live APIs are unconfigured

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")


settings = Settings()
