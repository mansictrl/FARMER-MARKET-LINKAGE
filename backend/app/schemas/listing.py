from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class ListingCreate(BaseModel):
    lot_id: int
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    commodity_id: int
    quantity_available: float = Field(..., gt=0)
    min_order_quantity: float = Field(default=1.0, gt=0)
    unit: str = "Quintal"
    asking_price_per_unit: Decimal = Field(..., gt=0)
    quality_grade: str = "Grade A"
    pickup_address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    quantity_available: Optional[float] = Field(None, gt=0)
    min_order_quantity: Optional[float] = Field(None, gt=0)
    asking_price_per_unit: Optional[Decimal] = Field(None, gt=0)
    quality_grade: Optional[str] = None
    status: Optional[str] = None


class ListingResponse(BaseModel):
    id: int
    lot_id: int
    seller_id: int
    seller_name: Optional[str] = None
    seller_role: Optional[str] = None
    title: str
    description: Optional[str] = None
    commodity_id: int
    commodity_name: Optional[str] = None
    quantity_available: float
    min_order_quantity: float
    unit: str
    asking_price_per_unit: Decimal
    currency: str
    quality_grade: str
    pickup_address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    status: str
    featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BuyerRequirementCreate(BaseModel):
    commodity_id: int
    preferred_quality_grade: Optional[str] = "Grade A"
    target_quantity: float = Field(..., gt=0)
    unit: str = "Quintal"
    target_price_per_unit: Optional[Decimal] = Field(None, gt=0)
    delivery_state: Optional[str] = None
    delivery_district: Optional[str] = None
    delivery_address: Optional[str] = None
    needed_by_date: Optional[datetime] = None
    notes: Optional[str] = None


class BuyerRequirementResponse(BaseModel):
    id: int
    buyer_id: int
    company_name: Optional[str] = None
    commodity_id: int
    commodity_name: Optional[str] = None
    preferred_quality_grade: Optional[str] = None
    target_quantity: float
    unit: str
    target_price_per_unit: Optional[Decimal] = None
    delivery_state: Optional[str] = None
    delivery_district: Optional[str] = None
    delivery_address: Optional[str] = None
    needed_by_date: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
