from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_buyer_or_fpo
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException
from app.models.offer import Offer
from app.models.listing import Listing
from app.models.user import User
from app.schemas.offer import OfferCreate, OfferStatusUpdate, OfferResponse
from app.services.offer_service import OfferService

router = APIRouter(prefix="/offers", tags=["Offers & Negotiations"])


def _format_offer(o: Offer) -> OfferResponse:
    return OfferResponse(
        id=o.id,
        listing_id=o.listing_id,
        listing_title=o.listing.title if o.listing else None,
        commodity_name=o.listing.commodity.name if o.listing and o.listing.commodity else None,
        seller_id=o.listing.seller_id if o.listing else None,
        seller_name=o.listing.seller.full_name if o.listing and o.listing.seller else None,
        buyer_id=o.buyer_id,
        buyer_company_name=o.buyer.company_name if o.buyer else None,
        offered_quantity=o.offered_quantity,
        offered_price_per_unit=o.offered_price_per_unit,
        total_amount=o.total_amount,
        counter_price_per_unit=o.counter_price_per_unit,
        proposed_delivery_date=o.proposed_delivery_date,
        notes=o.notes,
        seller_notes=o.seller_notes,
        status=o.status,
        created_at=o.created_at,
        updated_at=o.updated_at
    )


@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    req: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer_or_fpo)
):
    """Buyers can submit binding price and quantity offers against active listings."""
    offer = OfferService.create_offer(db, current_user, req)
    return _format_offer(offer)


@router.get("/sent", response_model=List[OfferResponse])
def get_sent_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns offers submitted by the current buyer."""
    if not current_user.buyer_profile and current_user.role != "admin":
        return []

    buyer_id = current_user.buyer_profile.id if current_user.buyer_profile else None
    query = db.query(Offer)
    if buyer_id:
        query = query.filter(Offer.buyer_id == buyer_id)
    records = query.order_by(desc(Offer.created_at)).all()
    return [_format_offer(o) for o in records]


@router.get("/received", response_model=List[OfferResponse])
def get_received_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns offers received on listings published by the current farmer or FPO."""
    records = (
        db.query(Offer)
        .join(Listing, Offer.listing_id == Listing.id)
        .filter(Listing.seller_id == current_user.id)
        .order_by(desc(Offer.created_at))
        .all()
    )
    return [_format_offer(o) for o in records]


@router.put("/{offer_id}/respond", response_model=OfferResponse)
def respond_to_offer(
    offer_id: int,
    req: OfferStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Farmers/Sellers accept, decline, or counter an offer. Accepting converts it into a Transaction."""
    offer = OfferService.respond_to_offer(db, current_user, offer_id, req)
    return _format_offer(offer)
