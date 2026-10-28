from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class KYCSubmitRequest(BaseModel):
    document_type: str = Field(..., description="AADHAAR, PAN, KISAN_CREDIT_CARD, GSTIN, TRADE_LICENSE, FPO_REGISTRATION")
    document_number: str = Field(..., min_length=4)
    document_url: Optional[str] = None


class KYCReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    remarks: Optional[str] = None


class KYCVerificationResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    user_email: Optional[str] = None
    document_type: str
    document_number: str
    document_url: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    verified_by_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    submitted_at: datetime

    class Config:
        from_attributes = True
