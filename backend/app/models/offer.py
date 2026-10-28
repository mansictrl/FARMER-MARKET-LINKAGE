from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import TimestampMixin


class Offer(Base, TimestampMixin):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    offered_quantity = Column(Float, nullable=False)
    offered_price_per_unit = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    
    counter_price_per_unit = Column(Numeric(12, 2), nullable=True)
    proposed_delivery_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    seller_notes = Column(Text, nullable=True)
    
    status = Column(String(50), default="PENDING", index=True, nullable=False)  # 'PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED'

    # Relationships
    listing = relationship("Listing", back_populates="offers")
    buyer = relationship("Buyer", back_populates="offers")
    transaction = relationship("Transaction", back_populates="offer", uselist=False)
