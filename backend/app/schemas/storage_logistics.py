from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class StorageFacilityResponse(BaseModel):
    id: int
    name: str
    facility_type: str
    capacity_metric_tonnes: float
    available_capacity_tonnes: float
    rate_per_quintal_per_month: Decimal
    address: str
    district: str
    state: str
    pincode: Optional[str] = None
    contact_number: Optional[str] = None
    is_wdra_accredited: bool
    features: Optional[str] = None

    class Config:
        from_attributes = True


class StorageBookingRequest(BaseModel):
    storage_facility_id: int
    lot_id: Optional[int] = None
    quantity_quintals: float = Field(..., gt=0)
    duration_months: int = Field(default=1, ge=1, le=12)


class LogisticsBookingRequest(BaseModel):
    transaction_id: Optional[int] = None
    origin_address: str = Field(..., min_length=5)
    destination_address: str = Field(..., min_length=5)
    vehicle_type: str = "Truck (10 Tonne)"
    pickup_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None


class LogisticsBookingResponse(BaseModel):
    id: int
    booking_code: str
    transaction_id: Optional[int] = None
    user_id: int
    provider_name: str
    vehicle_type: str
    origin_address: str
    destination_address: str
    distance_km: Optional[float] = None
    estimated_cost: Decimal
    pickup_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    tracking_number: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
