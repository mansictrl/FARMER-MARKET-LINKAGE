from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import TimestampMixin


class Recommendation(Base, TimestampMixin):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False)
    
    observed_current_price = Column(Numeric(12, 2), nullable=False)
    modal_price = Column(Numeric(12, 2), nullable=False)
    min_expected_price = Column(Numeric(12, 2), nullable=False)
    max_expected_price = Column(Numeric(12, 2), nullable=False)
    
    suggested_action = Column(String(50), default="SELL_NOW", nullable=False)  # 'SELL_NOW', 'HOLD_FOR_BETTER_PRICE', 'DIVERT_TO_ANOTHER_MANDI'
    suggested_selling_window = Column(String(100), nullable=True)  # e.g. "Next 3-5 days"
    
    transport_cost_estimate = Column(Numeric(10, 2), default=0.0, nullable=False)
    net_realization_estimate = Column(Numeric(12, 2), nullable=False)
    confidence_score = Column(Float, default=0.85, nullable=False)  # 0.0 to 1.0
    
    explanation = Column(Text, nullable=False)
    reasoning_factors = Column(JSON, nullable=True)  # breakdown of factors: arrival trend, seasonality, historical spread
    data_source_info = Column(String(100), default="Agmarknet Mandi Trend Analysis", nullable=False)

    farmer = relationship("User")
    commodity = relationship("Commodity")
    suggested_market = relationship("Market")
