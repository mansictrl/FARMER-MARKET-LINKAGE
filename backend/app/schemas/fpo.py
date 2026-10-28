from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class FPOMemberAddRequest(BaseModel):
    farmer_id: int
    membership_number: Optional[str] = None
    shares_held: int = Field(default=1, ge=1)


class FPOMemberResponse(BaseModel):
    id: int
    fpo_id: int
    farmer_id: int
    farmer_name: str
    farmer_phone: Optional[str] = None
    farmer_district: Optional[str] = None
    membership_number: Optional[str] = None
    joined_date: datetime
    shares_held: int
    status: str

    class Config:
        from_attributes = True


class FarmerShareItem(BaseModel):
    farmer_id: int
    farmer_name: Optional[str] = None
    contributed_quantity: float = Field(..., gt=0)


class FPOAggregationRequest(BaseModel):
    commodity_id: int
    variety: Optional[str] = None
    storage_type: Optional[str] = "FPO Collection Center"
    storage_address: Optional[str] = None
    contributing_farmer_shares: List[FarmerShareItem]


class FPOAggregationResponse(BaseModel):
    lot_id: int
    lot_code: str
    fpo_id: int
    commodity_id: int
    commodity_name: str
    total_aggregated_quantity: float
    contributing_farmers_count: int
    status: str
    created_at: datetime
