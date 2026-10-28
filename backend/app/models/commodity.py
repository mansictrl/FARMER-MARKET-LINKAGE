from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Commodity(Base, TimestampMixin):
    __tablename__ = "commodities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)  # 'Cereal', 'Pulse', 'Oilseed', 'Spice', 'Vegetable', 'Fruit', 'Fiber'
    standard_unit = Column(String(50), default="Quintal", nullable=False)  # 'Quintal', 'Kg', 'Tonne'
    min_support_price = Column(Numeric(12, 2), nullable=True)  # Goverment MSP if applicable
    shelf_life_days = Column(Integer, nullable=True)
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)

    quality_grades = relationship("QualityGrade", back_populates="commodity", cascade="all, delete-orphan")
    market_prices = relationship("MarketPrice", back_populates="commodity", cascade="all, delete-orphan")
    lots = relationship("Lot", back_populates="commodity")


class QualityGrade(Base, TimestampMixin):
    __tablename__ = "quality_grades"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False, index=True)
    grade_name = Column(String(100), nullable=False)  # 'Grade A (Premium)', 'Grade B (Standard)', 'Grade C (Industrial)', 'FAQ (Fair Average Quality)'
    moisture_max_percentage = Column(Float, nullable=True)
    foreign_matter_max_pct = Column(Float, nullable=True)
    broken_grains_max_pct = Column(Float, nullable=True)
    color_standard = Column(String(100), nullable=True)
    specifications = Column(Text, nullable=True)

    commodity = relationship("Commodity", back_populates="quality_grades")
