import json
import uuid
from typing import List
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BusinessLogicException
from app.models.user import User, Farmer, FPO, FPOMembership
from app.models.lot import Lot
from app.models.commodity import Commodity
from app.schemas.fpo import FPOMemberAddRequest, FPOMemberResponse, FPOAggregationRequest, FPOAggregationResponse


class FPOService:
    @staticmethod
    def add_member(db: Session, user: User, req: FPOMemberAddRequest) -> FPOMemberResponse:
        if user.role != "fpo" and user.role != "admin":
            raise PermissionDeniedException("Only FPOs can add member farmers.")

        fpo = user.fpo_profile
        if not fpo:
            raise EntityNotFoundException("FPO Profile", user.id)

        farmer = db.query(Farmer).filter(Farmer.id == req.farmer_id).first()
        if not farmer:
            raise EntityNotFoundException("Farmer", req.farmer_id)

        existing = db.query(FPOMembership).filter(
            FPOMembership.fpo_id == fpo.id,
            FPOMembership.farmer_id == farmer.id
        ).first()

        if existing:
            raise BusinessLogicException("Farmer is already a registered member of this FPO.")

        membership_no = req.membership_number or f"MEM-{fpo.id}-{farmer.id:04d}"
        membership = FPOMembership(
            fpo_id=fpo.id,
            farmer_id=farmer.id,
            membership_number=membership_no,
            shares_held=req.shares_held,
            status="ACTIVE"
        )
        db.add(membership)
        fpo.total_members = (fpo.total_members or 0) + 1
        db.commit()
        db.refresh(membership)

        return FPOMemberResponse(
            id=membership.id,
            fpo_id=fpo.id,
            farmer_id=farmer.id,
            farmer_name=farmer.user.full_name,
            farmer_phone=farmer.user.phone,
            farmer_district=farmer.district,
            membership_number=membership.membership_number,
            joined_date=membership.joined_date,
            shares_held=membership.shares_held,
            status=membership.status
        )

    @staticmethod
    def get_members(db: Session, user: User) -> List[FPOMemberResponse]:
        if not user.fpo_profile and user.role != "admin":
            return []
        
        fpo_id = user.fpo_profile.id if user.fpo_profile else 1
        memberships = db.query(FPOMembership).filter(FPOMembership.fpo_id == fpo_id).all()
        result = []
        for m in memberships:
            result.append(FPOMemberResponse(
                id=m.id,
                fpo_id=m.fpo_id,
                farmer_id=m.farmer_id,
                farmer_name=m.farmer.user.full_name,
                farmer_phone=m.farmer.user.phone,
                farmer_district=m.farmer.district,
                membership_number=m.membership_number,
                joined_date=m.joined_date,
                shares_held=m.shares_held,
                status=m.status
            ))
        return result

    @staticmethod
    def aggregate_lots(db: Session, user: User, req: FPOAggregationRequest) -> FPOAggregationResponse:
        if user.role != "fpo" and user.role != "admin":
            raise PermissionDeniedException("Only FPOs can create collective aggregated produce lots.")

        fpo = user.fpo_profile
        if not fpo:
            raise EntityNotFoundException("FPO Profile", user.id)

        commodity = db.query(Commodity).filter(Commodity.id == req.commodity_id).first()
        if not commodity:
            raise EntityNotFoundException("Commodity", req.commodity_id)

        if not req.contributing_farmer_shares:
            raise BusinessLogicException("At least one contributing farmer share is required to aggregate a lot.")

        total_quantity = sum([item.contributed_quantity for item in req.contributing_farmer_shares])

        # Serialize provenance notes
        shares_data = [
            {"farmer_id": s.farmer_id, "farmer_name": s.farmer_name, "quantity": s.contributed_quantity}
            for s in req.contributing_farmer_shares
        ]

        lot_code = f"LOT-FPO-{fpo.id}-{commodity.code}-{uuid.uuid4().hex[:6].upper()}"
        collective_lot = Lot(
            lot_code=lot_code,
            fpo_id=fpo.id,
            commodity_id=commodity.id,
            quantity=total_quantity,
            unit=commodity.standard_unit,
            variety=req.variety,
            storage_type=req.storage_type,
            storage_address=req.storage_address,
            is_aggregated=True,
            contributing_farmer_notes=json.dumps(shares_data),
            status="AVAILABLE"
        )
        db.add(collective_lot)
        db.commit()
        db.refresh(collective_lot)

        return FPOAggregationResponse(
            lot_id=collective_lot.id,
            lot_code=collective_lot.lot_code,
            fpo_id=fpo.id,
            commodity_id=commodity.id,
            commodity_name=commodity.name,
            total_aggregated_quantity=total_quantity,
            contributing_farmers_count=len(req.contributing_farmer_shares),
            status=collective_lot.status,
            created_at=collective_lot.created_at
        )
