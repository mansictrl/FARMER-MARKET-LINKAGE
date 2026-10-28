from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field


class InspectionCreate(BaseModel):
    lot_id: int
    moisture_percentage: Optional[float] = None
    foreign_matter_percentage: Optional[float] = None
    broken_grain_percentage: Optional[float] = None
    weeviled_grain_percentage: Optional[float] = None
    grade_assigned: str = "Grade A"
    certificate_number: Optional[str] = None
    certificate_url: Optional[str] = None
    remarks: Optional[str] = None
    status: str = "PASSED"


class InspectionResponse(BaseModel):
    id: int
    lot_id: int
    inspector_id: Optional[int] = None
    inspection_date: datetime
    moisture_percentage: Optional[float] = None
    foreign_matter_percentage: Optional[float] = None
    broken_grain_percentage: Optional[float] = None
    grade_assigned: str
    certificate_number: Optional[str] = None
    certificate_url: Optional[str] = None
    remarks: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class LotCreate(BaseModel):
    commodity_id: int
    quantity: float = Field(..., gt=0)
    unit: str = "Quintal"
    harvest_date: Optional[date] = None
    variety: Optional[str] = None
    storage_type: Optional[str] = "Farm Store"
    storage_address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    is_aggregated: bool = False
    contributing_farmer_notes: Optional[str] = None


class LotUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    storage_type: Optional[str] = None
    storage_address: Optional[str] = None
    status: Optional[str] = None


class LotResponse(BaseModel):
    id: int
    lot_code: str
    farmer_id: Optional[int] = None
    fpo_id: Optional[int] = None
    commodity_id: int
    commodity_name: Optional[str] = None
    quantity: float
    unit: str
    harvest_date: date
    variety: Optional[str] = None
    storage_type: Optional[str] = None
    storage_address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    is_aggregated: bool
    status: str
    created_at: datetime
    inspections: List[InspectionResponse] = []

    class Config:
        from_attributes = True
