from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User, Farmer, Buyer, FPO
from app.models.kyc import KYCVerification
from app.models.listing import Listing
from app.models.transaction import Transaction, Dispute
from app.models.market import MarketPrice
from app.schemas.admin import AdminDashboardStats, UserManagementItem, ListingModerationRequest

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/dashboard-stats", response_model=AdminDashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Returns platform-wide metrics, KYC backlog, transaction GMV, and market data status."""
    total_users = db.query(User).count()
    total_farmers = db.query(User).filter(User.role == "farmer").count()
    total_buyers = db.query(User).filter(User.role == "buyer").count()
    total_fpos = db.query(User).filter(User.role == "fpo").count()

    pending_kyc = db.query(KYCVerification).filter(KYCVerification.status == "PENDING").count()
    active_listings = db.query(Listing).filter(Listing.status == "ACTIVE").count()
    total_txns = db.query(Transaction).count()

    gmv_sum = db.query(func.sum(Transaction.total_amount)).scalar() or Decimal("0.00")
    open_disputes = db.query(Dispute).filter(Dispute.resolution_status == "OPEN").count()
    market_records = db.query(MarketPrice).count()

    last_sync_record = db.query(MarketPrice).order_by(desc(MarketPrice.updated_at)).first()
    last_sync = last_sync_record.updated_at if last_sync_record else None

    return AdminDashboardStats(
        total_users=total_users,
        total_farmers=total_farmers,
        total_buyers=total_buyers,
        total_fpos=total_fpos,
        pending_kyc_count=pending_kyc,
        active_listings_count=active_listings,
        total_transactions_count=total_txns,
        total_gmv_inr=gmv_sum,
        open_disputes_count=open_disputes,
        market_data_records_count=market_records,
        last_market_data_sync=last_sync
    )


@router.get("/users", response_model=List[UserManagementItem])
def get_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Retrieves all registered platform users with verification status and role."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(desc(User.created_at)).all()

    results = []
    for u in users:
        latest_kyc = db.query(KYCVerification).filter(KYCVerification.user_id == u.id).order_by(desc(KYCVerification.submitted_at)).first()
        kyc_status = latest_kyc.status if latest_kyc else ("VERIFIED" if u.is_verified else "NOT_SUBMITTED")
        results.append(UserManagementItem(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone=u.phone,
            role=u.role,
            is_active=u.is_active,
            is_verified=u.is_verified,
            kyc_status=kyc_status,
            created_at=u.created_at
        ))
    return results


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_active = not user.is_active
        db.commit()
    return {"id": user_id, "is_active": user.is_active if user else False}


@router.put("/listings/{listing_id}/moderate")
def moderate_listing(
    listing_id: int,
    req: ListingModerationRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing:
        listing.status = req.status
        db.commit()
    return {"id": listing_id, "status": listing.status if listing else "NOT_FOUND"}
