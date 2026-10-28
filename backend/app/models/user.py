from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, Text, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="farmer")  # 'farmer', 'buyer', 'fpo', 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    profile_photo_url = Column(String(500), nullable=True)

    # Relationships to role-specific profiles
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile = relationship("Buyer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    fpo_profile = relationship("FPO", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # KYC records
    kyc_records = relationship("KYCVerification", back_populates="user", foreign_keys="KYCVerification.user_id", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Farmer(Base, TimestampMixin):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    land_area_acres = Column(Float, nullable=True)
    farm_location = Column(String(255), nullable=True)
    primary_commodities = Column(String(500), nullable=True)  # Comma-separated or JSON
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    kisan_credit_card_no = Column(String(50), nullable=True)
    bank_account_no = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)

    user = relationship("User", back_populates="farmer_profile")
    fpo_memberships = relationship("FPOMembership", back_populates="farmer", cascade="all, delete-orphan")
    lots = relationship("Lot", back_populates="farmer", foreign_keys="Lot.farmer_id")


class Buyer(Base, TimestampMixin):
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    business_type = Column(String(100), nullable=True)  # 'Wholesaler', 'Processor', 'Retailer', 'Exporter'
    gst_number = Column(String(50), nullable=True)
    pan_number = Column(String(50), nullable=True)
    trade_license = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    delivery_address = Column(Text, nullable=True)

    user = relationship("User", back_populates="buyer_profile")
    buyer_requirements = relationship("BuyerRequirement", back_populates="buyer", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="buyer", cascade="all, delete-orphan")


class FPO(Base, TimestampMixin):
    __tablename__ = "fpos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    fpo_name = Column(String(255), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=False)
    year_established = Column(Integer, nullable=True)
    total_members = Column(Integer, default=0, nullable=False)
    operational_districts = Column(String(500), nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    bank_account_no = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)

    user = relationship("User", back_populates="fpo_profile")
    memberships = relationship("FPOMembership", back_populates="fpo", cascade="all, delete-orphan")
    aggregated_lots = relationship("Lot", back_populates="fpo", foreign_keys="Lot.fpo_id")


class FPOMembership(Base, TimestampMixin):
    __tablename__ = "fpo_memberships"

    id = Column(Integer, primary_key=True, index=True)
    fpo_id = Column(Integer, ForeignKey("fpos.id", ondelete="CASCADE"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    membership_number = Column(String(100), nullable=True)
    joined_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    shares_held = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # 'ACTIVE', 'INACTIVE'

    fpo = relationship("FPO", back_populates="memberships")
    farmer = relationship("Farmer", back_populates="fpo_memberships")
