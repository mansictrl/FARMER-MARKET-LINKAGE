from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime
from app.core.database import Base


class TimestampMixin:
    """Provides created_at and updated_at datetime fields with timezone support."""
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
