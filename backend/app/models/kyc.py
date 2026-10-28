from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import TimestampMixin


class KYCVerification(Base, TimestampMixin):
    __tablename__ = "kyc_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(100), nullable=False)  # 'AADHAAR', 'PAN', 'KISAN_CREDIT_CARD', 'GSTIN', 'TRADE_LICENSE', 'FPO_REGISTRATION'
    document_number = Column(String(100), nullable=False)
    document_url = Column(String(500), nullable=True)
    status = Column(String(50), default="PENDING", nullable=False, index=True)  # 'PENDING', 'APPROVED', 'REJECTED'
    remarks = Column(Text, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="kyc_records", foreign_keys=[user_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
