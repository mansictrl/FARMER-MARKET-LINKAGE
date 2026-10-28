from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.transaction import Transaction, Payment, Dispute, Review
from app.models.user import User
from app.schemas.transaction import (
    TransactionResponse, PaymentCreate, PaymentVerifyRequest, PaymentResponse,
    DisputeCreate, DisputeResolveRequest, DisputeResponse, ReviewCreate, ReviewResponse,
    TransactionStatusUpdate
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions & Escrow"])


def _format_transaction(t: Transaction) -> TransactionResponse:
    payments = [PaymentResponse.model_validate(p) for p in t.payments]
    reviews = [
        ReviewResponse(
            id=r.id,
            transaction_id=r.transaction_id,
            reviewer_id=r.reviewer_id,
            reviewer_name=r.reviewer.full_name if r.reviewer else "User",
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at
        ) for r in t.reviews
    ]
    disputes = [
        DisputeResponse(
            id=d.id,
            transaction_id=d.transaction_id,
            raised_by_id=d.raised_by_id,
            raised_by_name=d.raised_by.full_name if d.raised_by else "User",
            dispute_reason=d.dispute_reason,
            description=d.description,
            evidence_urls=d.evidence_urls,
            resolution_status=d.resolution_status,
            resolution_notes=d.resolution_notes,
            resolved_at=d.resolved_at,
            created_at=d.created_at
        ) for d in t.disputes
    ]

    return TransactionResponse(
        id=t.id,
        transaction_code=t.transaction_code,
        offer_id=t.offer_id,
        listing_id=t.listing_id,
        listing_title=t.listing.title if t.listing else None,
        commodity_name=t.listing.commodity.name if t.listing and t.listing.commodity else None,
        buyer_id=t.buyer_id,
        buyer_name=t.buyer.full_name if t.buyer else None,
        seller_id=t.seller_id,
        seller_name=t.seller.full_name if t.seller else None,
        agreed_quantity=t.agreed_quantity,
        agreed_price_per_unit=t.agreed_price_per_unit,
        total_amount=t.total_amount,
        payment_status=t.payment_status,
        fulfillment_status=t.fulfillment_status,
        delivery_address=t.delivery_address,
        completed_at=t.completed_at,
        created_at=t.created_at,
        updated_at=t.updated_at,
        payments=payments,
        reviews=reviews,
        disputes=disputes
    )


@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns active and completed transactions for the current logged-in user."""
    transactions = TransactionService.get_user_transactions(db, current_user)
    return [_format_transaction(t) for t in transactions]


@router.get("/{txn_id}", response_model=TransactionResponse)
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full details of a specific transaction including payments, reviews, and fulfillment stage."""
    t = TransactionService.get_transaction_by_id(db, current_user, txn_id)
    return _format_transaction(t)


@router.put("/{txn_id}/status", response_model=TransactionResponse)
def update_fulfillment_status(
    txn_id: int,
    req: TransactionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transitions deal lifecycle (ORDER_PLACED -> PACKED -> IN_TRANSIT -> DELIVERED -> COMPLETED)."""
    if not req.fulfillment_status:
        t = TransactionService.get_transaction_by_id(db, current_user, txn_id)
        return _format_transaction(t)

    t = TransactionService.update_fulfillment_status(db, current_user, txn_id, req.fulfillment_status)
    return _format_transaction(t)


@router.post("/payments/initiate", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def initiate_payment(
    req: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a Razorpay payment order for buyer to deposit funds into platform escrow."""
    payment = TransactionService.initiate_payment(db, current_user, req)
    return PaymentResponse.model_validate(payment)


@router.post("/payments/verify", response_model=PaymentResponse)
def verify_payment(
    req: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verifies cryptographic Razorpay signature and locks payment into platform escrow."""
    payment = TransactionService.verify_payment(db, current_user, req)
    return PaymentResponse.model_validate(payment)


@router.post("/disputes", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def raise_dispute(
    req: DisputeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Raises a formal transaction dispute (quality mismatch, quantity shortage, delivery failure)."""
    dispute = TransactionService.raise_dispute(db, current_user, req)
    return DisputeResponse(
        id=dispute.id,
        transaction_id=dispute.transaction_id,
        raised_by_id=dispute.raised_by_id,
        raised_by_name=current_user.full_name,
        dispute_reason=dispute.dispute_reason,
        description=dispute.description,
        evidence_urls=dispute.evidence_urls,
        resolution_status=dispute.resolution_status,
        resolution_notes=dispute.resolution_notes,
        resolved_at=dispute.resolved_at,
        created_at=dispute.created_at
    )


@router.put("/disputes/{dispute_id}/resolve", response_model=DisputeResponse)
def resolve_dispute(
    dispute_id: int,
    req: DisputeResolveRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin-only endpoint to adjudicate and resolve open disputes."""
    dispute = TransactionService.resolve_dispute(db, admin_user, dispute_id, req)
    return DisputeResponse(
        id=dispute.id,
        transaction_id=dispute.transaction_id,
        raised_by_id=dispute.raised_by_id,
        raised_by_name=dispute.raised_by.full_name if dispute.raised_by else "User",
        dispute_reason=dispute.dispute_reason,
        description=dispute.description,
        evidence_urls=dispute.evidence_urls,
        resolution_status=dispute.resolution_status,
        resolution_notes=dispute.resolution_notes,
        resolved_at=dispute.resolved_at,
        created_at=dispute.created_at
    )


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def add_review(
    req: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a 1-5 star review and feedback comment for a completed transaction."""
    review = TransactionService.add_review(db, current_user, req)
    return ReviewResponse(
        id=review.id,
        transaction_id=review.transaction_id,
        reviewer_id=review.reviewer_id,
        reviewer_name=current_user.full_name,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at
    )
