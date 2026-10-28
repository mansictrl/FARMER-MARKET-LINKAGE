from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey, Date, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import date, datetime, timezone
from app.core.database import Base
from app.models.base import TimestampMixin


class Lot(Base, TimestampMixin):
    __tablename__ = "lots"

    id = Column(Integer, primary_key=True, index=True)
    lot_code = Column(String(100), unique=True, index=True, nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="SET NULL"), nullable=True, index=True)
    fpo_id = Column(Integer, ForeignKey("fpos.id", ondelete="SET NULL"), nullable=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity = Column(Float, nullable=False)  # in commodity standard_unit (e.g. Quintals)
    unit = Column(String(50), default="Quintal", nullable=False)
    harvest_date = Column(Date, default=date.today, nullable=False)
    variety = Column(String(100), nullable=True)  # e.g. "Sharbati", "Pusa 1121", "Desi"
    
    storage_type = Column(String(100), default="Farm Store", nullable=True)  # 'Farm Store', 'Cold Storage', 'Warehouse', 'Silo'
    storage_address = Column(Text, nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    
    # FPO aggregation linkage & traceability
    is_aggregated = Column(Boolean, default=False, nullable=False)
    contributing_farmer_notes = Column(Text, nullable=True)  # JSON or text tracking pooled farmer shares
    
    status = Column(String(50), default="AVAILABLE", nullable=False, index=True)  # 'DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'DELIVERED'

    # Relationships
    farmer = relationship("Farmer", back_populates="lots", foreign_keys=[farmer_id])
    fpo = relationship("FPO", back_populates="aggregated_lots", foreign_keys=[fpo_id])
    commodity = relationship("Commodity", back_populates="lots")
    inspections = relationship("Inspection", back_populates="lot", cascade="all, delete-orphan")
    listings = relationship("Listing", back_populates="lot", cascade="all, delete-orphan")


class Inspection(Base, TimestampMixin):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.id", ondelete="CASCADE"), nullable=False, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    inspection_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    moisture_percentage = Column(Float, nullable=True)
    foreign_matter_percentage = Column(Float, nullable=True)
    broken_grain_percentage = Column(Float, nullable=True)
    weeviled_grain_percentage = Column(Float, nullable=True)
    grade_assigned = Column(String(100), default="Grade A", nullable=False)
    certificate_number = Column(String(100), unique=True, nullable=True)
    certificate_url = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    status = Column(String(50), default="PASSED", nullable=False)  # 'PASSED', 'FAILED', 'PENDING'

    lot = relationship("Lot", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id])
