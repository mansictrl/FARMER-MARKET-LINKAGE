from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import TimestampMixin


class Listing(Base, TimestampMixin):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity_available = Column(Float, nullable=False)
    min_order_quantity = Column(Float, default=1.0, nullable=False)
    unit = Column(String(50), default="Quintal", nullable=False)
    
    asking_price_per_unit = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    quality_grade = Column(String(100), default="Grade A", nullable=False)
    
    pickup_address = Column(Text, nullable=True)
    district = Column(String(100), index=True, nullable=True)
    state = Column(String(100), index=True, nullable=True)
    pincode = Column(String(20), nullable=True)
    
    status = Column(String(50), default="ACTIVE", index=True, nullable=False)  # 'ACTIVE', 'UNDER_NEGOTIATION', 'CLOSED', 'EXPIRED'
    featured = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    lot = relationship("Lot", back_populates="listings")
    seller = relationship("User", foreign_keys=[seller_id])
    commodity = relationship("Commodity")
    offers = relationship("Offer", back_populates="listing", cascade="all, delete-orphan")


class BuyerRequirement(Base, TimestampMixin):
    __tablename__ = "buyer_requirements"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="CASCADE"), nullable=False, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    preferred_quality_grade = Column(String(100), default="Grade A", nullable=True)
    target_quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="Quintal", nullable=False)
    target_price_per_unit = Column(Numeric(12, 2), nullable=True)
    
    delivery_state = Column(String(100), nullable=True)
    delivery_district = Column(String(100), nullable=True)
    delivery_address = Column(Text, nullable=True)
    needed_by_date = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(String(50), default="OPEN", index=True, nullable=False)  # 'OPEN', 'FULFILLED', 'CANCELLED'
    notes = Column(Text, nullable=True)

    buyer = relationship("Buyer", back_populates="buyer_requirements")
    commodity = relationship("Commodity")
