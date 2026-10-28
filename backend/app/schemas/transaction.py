from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    transaction_id: int
    payment_method: str = "RAZORPAY_TEST"


class PaymentVerifyRequest(BaseModel):
    payment_id: int
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    id: int
    payment_code: str
    transaction_id: int
    amount: Decimal
    currency: str
    payment_gateway_order_id: Optional[str] = None
    payment_gateway_payment_id: Optional[str] = None
    payment_method: str
    status: str
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    transaction_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    transaction_id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DisputeCreate(BaseModel):
    transaction_id: int
    dispute_reason: str = Field(..., description="QUALITY_MISMATCH, QUANTITY_SHORTAGE, TRANSIT_DAMAGE, NON_DELIVERY")
    description: str = Field(..., min_length=10)
    evidence_urls: Optional[List[str]] = None


class DisputeResolveRequest(BaseModel):
    resolution_status: str = Field(..., pattern="^(RESOLVED|DISMISSED)$")
    resolution_notes: str = Field(..., min_length=5)


class DisputeResponse(BaseModel):
    id: int
    transaction_id: int
    raised_by_id: int
    raised_by_name: Optional[str] = None
    dispute_reason: str
    description: str
    evidence_urls: Optional[List[str]] = None
    resolution_status: str
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionStatusUpdate(BaseModel):
    fulfillment_status: Optional[str] = None
    payment_status: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    transaction_code: str
    offer_id: int
    listing_id: int
    listing_title: Optional[str] = None
    commodity_name: Optional[str] = None
    buyer_id: int
    buyer_name: Optional[str] = None
    seller_id: int
    seller_name: Optional[str] = None
    agreed_quantity: float
    agreed_price_per_unit: Decimal
    total_amount: Decimal
    payment_status: str
    fulfillment_status: str
    delivery_address: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    payments: List[PaymentResponse] = []
    reviews: List[ReviewResponse] = []
    disputes: List[DisputeResponse] = []

    class Config:
        from_attributes = True
