from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel


class QualityGradeResponse(BaseModel):
    id: int
    commodity_id: int
    grade_name: str
    moisture_max_percentage: Optional[float] = None
    foreign_matter_max_pct: Optional[float] = None
    broken_grains_max_pct: Optional[float] = None
    color_standard: Optional[str] = None
    specifications: Optional[str] = None

    class Config:
        from_attributes = True


class CommodityCreate(BaseModel):
    name: str
    code: str
    category: str
    standard_unit: str = "Quintal"
    min_support_price: Optional[Decimal] = None
    shelf_life_days: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None


class CommodityResponse(BaseModel):
    id: int
    name: str
    code: str
    category: str
    standard_unit: str
    min_support_price: Optional[Decimal] = None
    shelf_life_days: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    quality_grades: List[QualityGradeResponse] = []

    class Config:
        from_attributes = True
