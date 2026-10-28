from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    commodity_id: int
    quantity: float = Field(..., gt=0, description="Quantity in Quintals")
    farmer_district: Optional[str] = None
    farmer_state: Optional[str] = None
    storage_available: bool = False
    holding_capacity_days: Optional[int] = 15


class RecommendationResponse(BaseModel):
    id: Optional[int] = None
    commodity_id: int
    commodity_name: str
    suggested_market_id: int
    suggested_market_name: str
    suggested_market_state: str
    
    observed_current_price: Decimal
    modal_price: Decimal
    min_expected_price: Decimal
    max_expected_price: Decimal
    
    suggested_action: str  # 'SELL_NOW', 'HOLD_FOR_BETTER_PRICE', 'DIVERT_TO_ANOTHER_MANDI'
    suggested_selling_window: str
    transport_cost_estimate: Decimal
    net_realization_estimate: Decimal
    confidence_score: float
    
    explanation: str
    reasoning_factors: Dict[str, Any]
    data_source_info: str
    generated_at: datetime

    class Config:
        from_attributes = True
