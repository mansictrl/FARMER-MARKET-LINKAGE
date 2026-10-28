from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO", nullable=False)  # 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'KYC_APPROVED', 'KYC_REJECTED', 'PAYMENT_RECEIVED', 'DELIVERY_UPDATE', 'PRICE_ALERT'
    reference_type = Column(String(50), nullable=True)  # 'offer', 'transaction', 'kyc', 'listing'
    reference_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)

    user = relationship("User", back_populates="notifications")
