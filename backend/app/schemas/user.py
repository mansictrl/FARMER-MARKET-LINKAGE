from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr


class FarmerProfileSchema(BaseModel):
    id: Optional[int] = None
    land_area_acres: Optional[float] = None
    farm_location: Optional[str] = None
    primary_commodities: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    kisan_credit_card_no: Optional[str] = None
    bank_account_no: Optional[str] = None
    ifsc_code: Optional[str] = None

    class Config:
        from_attributes = True


class BuyerProfileSchema(BaseModel):
    id: Optional[int] = None
    company_name: str
    business_type: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    trade_license: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    delivery_address: Optional[str] = None

    class Config:
        from_attributes = True


class FPOProfileSchema(BaseModel):
    id: Optional[int] = None
    fpo_name: str
    registration_number: str
    year_established: Optional[int] = None
    total_members: int = 0
    operational_districts: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    bank_account_no: Optional[str] = None
    ifsc_code: Optional[str] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    phone: Optional[str] = None
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    profile_photo_url: Optional[str] = None
    created_at: datetime
    
    farmer_profile: Optional[FarmerProfileSchema] = None
    buyer_profile: Optional[BuyerProfileSchema] = None
    fpo_profile: Optional[FPOProfileSchema] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None
    
    farmer_profile: Optional[FarmerProfileSchema] = None
    buyer_profile: Optional[BuyerProfileSchema] = None
    fpo_profile: Optional[FPOProfileSchema] = None
