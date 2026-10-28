from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class StorageFacility(Base, TimestampMixin):
    __tablename__ = "storage_facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False)
    facility_type = Column(String(100), default="Cold Storage", nullable=False)  # 'Cold Storage', 'Dry Warehouse', 'Grain Silo'
    capacity_metric_tonnes = Column(Float, nullable=False)
    available_capacity_tonnes = Column(Float, nullable=False)
    rate_per_quintal_per_month = Column(Numeric(10, 2), nullable=False)
    
    address = Column(Text, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    state = Column(String(100), index=True, nullable=False)
    pincode = Column(String(20), nullable=True)
    contact_number = Column(String(50), nullable=True)
    is_wdra_accredited = Column(Boolean, default=True, nullable=False)  # Warehousing Development and Regulatory Authority accredited
    features = Column(String(500), nullable=True)  # 'Temperature Controlled, CCTV, Fumigation'


class LogisticsBooking(Base, TimestampMixin):
    __tablename__ = "logistics_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String(100), unique=True, index=True, nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    provider_name = Column(String(150), default="Kisan Logistics Network", nullable=False)
    vehicle_type = Column(String(100), default="Truck (10 Tonne)", nullable=False)
    origin_address = Column(Text, nullable=False)
    destination_address = Column(Text, nullable=False)
    distance_km = Column(Float, nullable=True)
    estimated_cost = Column(Numeric(12, 2), nullable=False)
    
    pickup_date = Column(DateTime(timezone=True), nullable=True)
    delivery_date = Column(DateTime(timezone=True), nullable=True)
    tracking_number = Column(String(100), unique=True, nullable=True)
    status = Column(String(50), default="CONFIRMED", index=True, nullable=False)  # 'REQUESTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'

    transaction = relationship("Transaction", back_populates="logistics_bookings")
    user = relationship("User")
