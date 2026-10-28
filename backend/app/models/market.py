from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey, Date, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import date
from app.core.database import Base
from app.models.base import TimestampMixin


class Market(Base, TimestampMixin):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=True)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    is_apmc = Column(Boolean, default=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_details = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    prices = relationship("MarketPrice", back_populates="market", cascade="all, delete-orphan")
    arrival_volumes = relationship("ArrivalVolume", back_populates="market", cascade="all, delete-orphan")


class MarketPrice(Base, TimestampMixin):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False, index=True)
    price_date = Column(Date, default=date.today, nullable=False, index=True)
    min_price = Column(Numeric(12, 2), nullable=False)
    max_price = Column(Numeric(12, 2), nullable=False)
    modal_price = Column(Numeric(12, 2), nullable=False)
    arrival_volume = Column(Float, default=0.0, nullable=True)  # in Quintals
    unit = Column(String(50), default="Rs/Quintal", nullable=False)
    source = Column(String(100), default="Agmarknet Demo", nullable=False)  # 'Agmarknet Live', 'Agmarknet Verified', 'CSV Ingest', 'Demo Simulated'
    raw_response = Column(JSON, nullable=True)

    commodity = relationship("Commodity", back_populates="market_prices")
    market = relationship("Market", back_populates="prices")


class ArrivalVolume(Base, TimestampMixin):
    __tablename__ = "arrival_volumes"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(Date, default=date.today, nullable=False, index=True)
    volume_quintals = Column(Float, nullable=False)
    trend_percentage = Column(Float, default=0.0, nullable=True)  # +5% or -10% vs 7-day rolling avg

    market = relationship("Market", back_populates="arrival_volumes")


class DemandSupplyData(Base, TimestampMixin):
    __tablename__ = "demand_supply_data"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    state = Column(String(100), index=True, nullable=False)
    period = Column(String(50), nullable=False)  # e.g. "2026-Q1", "2026-Oct"
    estimated_production_tonnes = Column(Float, nullable=True)
    estimated_demand_tonnes = Column(Float, nullable=True)
    stock_to_use_ratio = Column(Float, nullable=True)
    market_sentiment = Column(String(50), default="STABLE")  # 'BULLISH', 'BEARISH', 'STABLE'
