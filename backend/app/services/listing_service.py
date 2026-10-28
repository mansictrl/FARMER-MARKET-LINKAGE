import uuid
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BusinessLogicException
from app.models.lot import Lot, Inspection
from app.models.listing import Listing, BuyerRequirement
from app.models.commodity import Commodity
from app.models.user import User, Farmer, FPO
from app.schemas.lot import LotCreate, LotUpdate, InspectionCreate
from app.schemas.listing import ListingCreate, ListingUpdate, BuyerRequirementCreate


class ListingService:
    @staticmethod
    def create_lot(db: Session, user: User, req: LotCreate) -> Lot:
        commodity = db.query(Commodity).filter(Commodity.id == req.commodity_id).first()
        if not commodity:
            raise EntityNotFoundException("Commodity", req.commodity_id)

        farmer_id = None
        fpo_id = None

        if user.role == "farmer":
            if not user.farmer_profile:
                farmer = Farmer(user_id=user.id, state=req.state, district=req.district)
                db.add(farmer)
                db.flush()
                farmer_id = farmer.id
            else:
                farmer_id = user.farmer_profile.id
        elif user.role == "fpo":
            if not user.fpo_profile:
                raise BusinessLogicException("FPO profile not established.")
            fpo_id = user.fpo_profile.id
        elif user.role == "admin":
            pass
        else:
            raise PermissionDeniedException("Only farmers and FPOs can register produce lots.")

        lot_code = f"LOT-{commodity.code}-{uuid.uuid4().hex[:6].upper()}"
        lot = Lot(
            lot_code=lot_code,
            farmer_id=farmer_id,
            fpo_id=fpo_id,
            commodity_id=req.commodity_id,
            quantity=req.quantity,
            unit=req.unit,
            harvest_date=req.harvest_date,
            variety=req.variety,
            storage_type=req.storage_type,
            storage_address=req.storage_address,
            district=req.district or (user.farmer_profile.district if user.farmer_profile else None),
            state=req.state or (user.farmer_profile.state if user.farmer_profile else None),
            is_aggregated=req.is_aggregated,
            contributing_farmer_notes=req.contributing_farmer_notes,
            status="AVAILABLE"
        )
        db.add(lot)
        db.commit()
        db.refresh(lot)
        return lot

    @staticmethod
    def add_inspection(db: Session, inspector: User, req: InspectionCreate) -> Inspection:
        lot = db.query(Lot).filter(Lot.id == req.lot_id).first()
        if not lot:
            raise EntityNotFoundException("Lot", req.lot_id)

        cert_num = f"CERT-INSP-{uuid.uuid4().hex[:8].upper()}"
        inspection = Inspection(
            lot_id=lot.id,
            inspector_id=inspector.id,
            moisture_percentage=req.moisture_percentage,
            foreign_matter_percentage=req.foreign_matter_percentage,
            broken_grain_percentage=req.broken_grain_percentage,
            weeviled_grain_percentage=req.weeviled_grain_percentage,
            grade_assigned=req.grade_assigned,
            certificate_number=cert_num,
            certificate_url=req.certificate_url,
            remarks=req.remarks,
            status=req.status
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)
        return inspection

    @staticmethod
    def create_listing(db: Session, user: User, req: ListingCreate) -> Listing:
        lot = db.query(Lot).filter(Lot.id == req.lot_id).first()
        if not lot:
            raise EntityNotFoundException("Lot", req.lot_id)

        # Ownership verification
        if user.role == "farmer":
            if not user.farmer_profile or lot.farmer_id != user.farmer_profile.id:
                raise PermissionDeniedException("You can only publish listings for your own produce lots.")
        elif user.role == "fpo":
            if not user.fpo_profile or lot.fpo_id != user.fpo_profile.id:
                raise PermissionDeniedException("You can only publish listings for lots registered by your FPO.")

        if req.quantity_available > lot.quantity:
            raise BusinessLogicException(f"Listing quantity ({req.quantity_available}) cannot exceed lot quantity ({lot.quantity}).")

        listing = Listing(
            lot_id=lot.id,
            seller_id=user.id,
            title=req.title,
            description=req.description,
            commodity_id=req.commodity_id,
            quantity_available=req.quantity_available,
            min_order_quantity=req.min_order_quantity,
            unit=req.unit,
            asking_price_per_unit=req.asking_price_per_unit,
            currency="INR",
            quality_grade=req.quality_grade,
            pickup_address=req.pickup_address or lot.storage_address,
            district=req.district or lot.district,
            state=req.state or lot.state,
            pincode=req.pincode,
            status="ACTIVE"
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)
        return listing

    @staticmethod
    def get_listings(
        db: Session,
        commodity_id: Optional[int] = None,
        quality_grade: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        search: Optional[str] = None,
        status: Optional[str] = "ACTIVE",
        seller_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Listing], int]:
        query = db.query(Listing)

        if status:
            query = query.filter(Listing.status == status)
        if seller_id:
            query = query.filter(Listing.seller_id == seller_id)
        if commodity_id:
            query = query.filter(Listing.commodity_id == commodity_id)
        if quality_grade:
            query = query.filter(Listing.quality_grade == quality_grade)
        if state:
            query = query.filter(Listing.state.ilike(f"%{state}%"))
        if district:
            query = query.filter(Listing.district.ilike(f"%{district}%"))
        if min_price is not None:
            query = query.filter(Listing.asking_price_per_unit >= min_price)
        if max_price is not None:
            query = query.filter(Listing.asking_price_per_unit <= max_price)
        if search:
            search_filter = or_(
                Listing.title.ilike(f"%{search}%"),
                Listing.description.ilike(f"%{search}%"),
                Listing.district.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        total = query.count()
        listings = query.order_by(desc(Listing.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return listings, total

    @staticmethod
    def create_buyer_requirement(db: Session, user: User, req: BuyerRequirementCreate) -> BuyerRequirement:
        if user.role != "buyer" and user.role != "admin":
            raise PermissionDeniedException("Only buyers can post buying requirements.")

        if not user.buyer_profile:
            buyer = Buyer(user_id=user.id, company_name=f"{user.full_name}'s Enterprise")
            db.add(buyer)
            db.flush()
            buyer_id = buyer.id
        else:
            buyer_id = user.buyer_profile.id

        requirement = BuyerRequirement(
            buyer_id=buyer_id,
            commodity_id=req.commodity_id,
            preferred_quality_grade=req.preferred_quality_grade,
            target_quantity=req.target_quantity,
            unit=req.unit,
            target_price_per_unit=req.target_price_per_unit,
            delivery_state=req.delivery_state,
            delivery_district=req.delivery_district,
            delivery_address=req.delivery_address,
            needed_by_date=req.needed_by_date,
            notes=req.notes,
            status="OPEN"
        )
        db.add(requirement)
        db.commit()
        db.refresh(requirement)
        return requirement
