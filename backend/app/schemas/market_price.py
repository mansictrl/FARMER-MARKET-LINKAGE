from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel


class MarketResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    state: str
    district: str
    is_apmc: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_details: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


class MarketPriceResponse(BaseModel):
    id: int
    commodity_id: int
    commodity_name: Optional[str] = None
    market_id: int
    market_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    price_date: date
    min_price: Decimal
    max_price: Decimal
    modal_price: Decimal
    arrival_volume: Optional[float] = None
    unit: str
    source: str
    updated_at: datetime

    class Config:
        from_attributes = True


class HistoricalTrendPoint(BaseModel):
    date: str
    min_price: float
    max_price: float
    modal_price: float
    arrival_volume: Optional[float] = None


class PriceComparisonItem(BaseModel):
    market_id: int
    market_name: str
    state: str
    district: str
    modal_price: Decimal
    min_price: Decimal
    max_price: Decimal
    arrival_volume: float
    distance_estimate_km: Optional[float] = None
    source: str
    last_updated: str


class PriceComparisonResponse(BaseModel):
    commodity_id: int
    commodity_name: str
    reference_date: str
    average_modal_price: Decimal
    highest_market: Optional[str] = None
    highest_price: Optional[Decimal] = None
    lowest_market: Optional[str] = None
    lowest_price: Optional[Decimal] = None
    markets: List[PriceComparisonItem]


class CSVPriceImportResult(BaseModel):
    total_records_processed: int
    inserted_records: int
    updated_records: int
    errors: List[str] = []
    source: str = "CSV Batch Import"
