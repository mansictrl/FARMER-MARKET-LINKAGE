from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_farmer_or_fpo, require_buyer_or_fpo
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException
from app.models.listing import Listing, BuyerRequirement
from app.models.user import User
from app.schemas.listing import (
    ListingCreate, ListingUpdate, ListingResponse,
    BuyerRequirementCreate, BuyerRequirementResponse
)
from app.services.listing_service import ListingService

router = APIRouter(prefix="/listings", tags=["Marketplace Listings"])


@router.get("", response_model=List[ListingResponse])
def get_marketplace_listings(
    commodity_id: Optional[int] = None,
    quality_grade: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    search: Optional[str] = None,
    seller_id: Optional[int] = None,
    status: Optional[str] = "ACTIVE",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Public and Buyer endpoint to search and filter active produce listings 
    by commodity, quality grade, asking price, and location.
    """
    listings, total = ListingService.get_listings(
        db,
        commodity_id=commodity_id,
        quality_grade=quality_grade,
        state=state,
        district=district,
        min_price=min_price,
        max_price=max_price,
        search=search,
        status=status,
        seller_id=seller_id,
        page=page,
        page_size=page_size
    )

    results = []
    for l in listings:
        results.append(ListingResponse(
            id=l.id,
            lot_id=l.lot_id,
            seller_id=l.seller_id,
            seller_name=l.seller.full_name if l.seller else "Farmer",
            seller_role=l.seller.role if l.seller else "farmer",
            title=l.title,
            description=l.description,
            commodity_id=l.commodity_id,
            commodity_name=l.commodity.name if l.commodity else None,
            quantity_available=l.quantity_available,
            min_order_quantity=l.min_order_quantity,
            unit=l.unit,
            asking_price_per_unit=l.asking_price_per_unit,
            currency=l.currency,
            quality_grade=l.quality_grade,
            pickup_address=l.pickup_address,
            district=l.district,
            state=l.state,
            pincode=l.pincode,
            status=l.status,
            featured=l.featured,
            created_at=l.created_at
        ))
    return results


@router.get("/my-listings", response_model=List[ListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns listings published by the current authenticated seller."""
    listings = db.query(Listing).filter(Listing.seller_id == current_user.id).order_by(Listing.created_at.desc()).all()
    results = []
    for l in listings:
        results.append(ListingResponse(
            id=l.id,
            lot_id=l.lot_id,
            seller_id=l.seller_id,
            seller_name=current_user.full_name,
            seller_role=current_user.role,
            title=l.title,
            description=l.description,
            commodity_id=l.commodity_id,
            commodity_name=l.commodity.name if l.commodity else None,
            quantity_available=l.quantity_available,
            min_order_quantity=l.min_order_quantity,
            unit=l.unit,
            asking_price_per_unit=l.asking_price_per_unit,
            currency=l.currency,
            quality_grade=l.quality_grade,
            pickup_address=l.pickup_address,
            district=l.district,
            state=l.state,
            pincode=l.pincode,
            status=l.status,
            featured=l.featured,
            created_at=l.created_at
        ))
    return results


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing_by_id(listing_id: int, db: Session = Depends(get_db)):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise EntityNotFoundException("Listing", listing_id)

    return ListingResponse(
        id=l.id,
        lot_id=l.lot_id,
        seller_id=l.seller_id,
        seller_name=l.seller.full_name if l.seller else "Farmer",
        seller_role=l.seller.role if l.seller else "farmer",
        title=l.title,
        description=l.description,
        commodity_id=l.commodity_id,
        commodity_name=l.commodity.name if l.commodity else None,
        quantity_available=l.quantity_available,
        min_order_quantity=l.min_order_quantity,
        unit=l.unit,
        asking_price_per_unit=l.asking_price_per_unit,
        currency=l.currency,
        quality_grade=l.quality_grade,
        pickup_address=l.pickup_address,
        district=l.district,
        state=l.state,
        pincode=l.pincode,
        status=l.status,
        featured=l.featured,
        created_at=l.created_at
    )


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    req: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_farmer_or_fpo)
):
    """Publishes a verified lot as a commercial sale listing."""
    listing = ListingService.create_listing(db, current_user, req)
    return ListingResponse(
        id=listing.id,
        lot_id=listing.lot_id,
        seller_id=listing.seller_id,
        seller_name=current_user.full_name,
        seller_role=current_user.role,
        title=listing.title,
        description=listing.description,
        commodity_id=listing.commodity_id,
        commodity_name=listing.commodity.name if listing.commodity else None,
        quantity_available=listing.quantity_available,
        min_order_quantity=listing.min_order_quantity,
        unit=listing.unit,
        asking_price_per_unit=listing.asking_price_per_unit,
        currency=listing.currency,
        quality_grade=listing.quality_grade,
        pickup_address=listing.pickup_address,
        district=listing.district,
        state=listing.state,
        pincode=listing.pincode,
        status=listing.status,
        featured=listing.featured,
        created_at=listing.created_at
    )


# Buyer Requirements Endpoints
@router.post("/buyer-requirements", response_model=BuyerRequirementResponse, status_code=status.HTTP_201_CREATED)
def create_buyer_requirement(
    req: BuyerRequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer_or_fpo)
):
    """Allows buyers and FPOs to publish purchase requirements."""
    req_item = ListingService.create_buyer_requirement(db, current_user, req)
    return BuyerRequirementResponse(
        id=req_item.id,
        buyer_id=req_item.buyer_id,
        company_name=req_item.buyer.company_name if req_item.buyer else "Buyer",
        commodity_id=req_item.commodity_id,
        commodity_name=req_item.commodity.name if req_item.commodity else None,
        preferred_quality_grade=req_item.preferred_quality_grade,
        target_quantity=req_item.target_quantity,
        unit=req_item.unit,
        target_price_per_unit=req_item.target_price_per_unit,
        delivery_state=req_item.delivery_state,
        delivery_district=req_item.delivery_district,
        delivery_address=req_item.delivery_address,
        needed_by_date=req_item.needed_by_date,
        status=req_item.status,
        notes=req_item.notes,
        created_at=req_item.created_at
    )


@router.get("/buyer-requirements/all", response_model=List[BuyerRequirementResponse])
def get_all_buyer_requirements(
    commodity_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieves all active open purchase requirements posted by agribusiness buyers."""
    query = db.query(BuyerRequirement).filter(BuyerRequirement.status == "OPEN")
    if commodity_id:
        query = query.filter(BuyerRequirement.commodity_id == commodity_id)
    records = query.order_by(BuyerRequirement.created_at.desc()).all()

    results = []
    for r in records:
        results.append(BuyerRequirementResponse(
            id=r.id,
            buyer_id=r.buyer_id,
            company_name=r.buyer.company_name if r.buyer else "Buyer",
            commodity_id=r.commodity_id,
            commodity_name=r.commodity.name if r.commodity else None,
            preferred_quality_grade=r.preferred_quality_grade,
            target_quantity=r.target_quantity,
            unit=r.unit,
            target_price_per_unit=r.target_price_per_unit,
            delivery_state=r.delivery_state,
            delivery_district=r.delivery_district,
            delivery_address=r.delivery_address,
            needed_by_date=r.needed_by_date,
            status=r.status,
            notes=r.notes,
            created_at=r.created_at
        ))
    return results
