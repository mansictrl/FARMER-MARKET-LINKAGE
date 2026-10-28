from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    role: str = Field(..., pattern="^(farmer|buyer|fpo|admin)$")
    
    # Optional profile fields during initial registration
    company_name: Optional[str] = None  # for buyer
    fpo_name: Optional[str] = None  # for FPO
    registration_number: Optional[str] = None  # for FPO
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
