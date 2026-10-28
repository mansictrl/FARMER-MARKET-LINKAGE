from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class AdminDashboardStats(BaseModel):
    total_users: int
    total_farmers: int
    total_buyers: int
    total_fpos: int
    pending_kyc_count: int
    active_listings_count: int
    total_transactions_count: int
    total_gmv_inr: Decimal
    open_disputes_count: int
    market_data_records_count: int
    last_market_data_sync: Optional[datetime] = None


class UserManagementItem(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    kyc_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ListingModerationRequest(BaseModel):
    status: str  # 'ACTIVE', 'CLOSED', 'EXPIRED'
    moderation_notes: Optional[str] = None
