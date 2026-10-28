from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class OfferCreate(BaseModel):
    listing_id: int
    offered_quantity: float = Field(..., gt=0)
    offered_price_per_unit: Decimal = Field(..., gt=0)
    proposed_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None


class OfferCounter(BaseModel):
    counter_price_per_unit: Decimal = Field(..., gt=0)
    seller_notes: Optional[str] = None


class OfferStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(ACCEPTED|REJECTED|COUNTERED)$")
    counter_price_per_unit: Optional[Decimal] = None
    seller_notes: Optional[str] = None


class OfferResponse(BaseModel):
    id: int
    listing_id: int
    listing_title: Optional[str] = None
    commodity_name: Optional[str] = None
    seller_id: Optional[int] = None
    seller_name: Optional[str] = None
    buyer_id: int
    buyer_company_name: Optional[str] = None
    offered_quantity: float
    offered_price_per_unit: Decimal
    total_amount: Decimal
    counter_price_per_unit: Optional[Decimal] = None
    proposed_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    seller_notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
