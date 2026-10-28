from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_farmer_or_fpo
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException
from app.models.lot import Lot, Inspection
from app.models.user import User
from app.schemas.lot import LotCreate, LotUpdate, LotResponse, InspectionCreate, InspectionResponse
from app.services.listing_service import ListingService

router = APIRouter(prefix="/lots", tags=["Produce Lots"])


@router.post("", response_model=LotResponse, status_code=status.HTTP_201_CREATED)
def create_lot(
    req: LotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_farmer_or_fpo)
):
    """Registers a new physical harvest lot for sale."""
    lot = ListingService.create_lot(db, current_user, req)
    return LotResponse(
        id=lot.id,
        lot_code=lot.lot_code,
        farmer_id=lot.farmer_id,
        fpo_id=lot.fpo_id,
        commodity_id=lot.commodity_id,
        commodity_name=lot.commodity.name if lot.commodity else None,
        quantity=lot.quantity,
        unit=lot.unit,
        harvest_date=lot.harvest_date,
        variety=lot.variety,
        storage_type=lot.storage_type,
        storage_address=lot.storage_address,
        district=lot.district,
        state=lot.state,
        is_aggregated=lot.is_aggregated,
        status=lot.status,
        created_at=lot.created_at,
        inspections=[]
    )


@router.get("", response_model=List[LotResponse])
def get_my_lots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns lots registered by the logged-in farmer or FPO."""
    query = db.query(Lot)
    if current_user.role == "farmer":
        if current_user.farmer_profile:
            query = query.filter(Lot.farmer_id == current_user.farmer_profile.id)
        else:
            return []
    elif current_user.role == "fpo":
        if current_user.fpo_profile:
            query = query.filter(Lot.fpo_id == current_user.fpo_profile.id)
        else:
            return []
    elif current_user.role == "admin":
        pass

    lots = query.order_by(desc(Lot.created_at)).all()
    results = []
    for l in lots:
        insp_responses = [
            InspectionResponse.model_validate(i) for i in l.inspections
        ]
        results.append(LotResponse(
            id=l.id,
            lot_code=l.lot_code,
            farmer_id=l.farmer_id,
            fpo_id=l.fpo_id,
            commodity_id=l.commodity_id,
            commodity_name=l.commodity.name if l.commodity else None,
            quantity=l.quantity,
            unit=l.unit,
            harvest_date=l.harvest_date,
            variety=l.variety,
            storage_type=l.storage_type,
            storage_address=l.storage_address,
            district=l.district,
            state=l.state,
            is_aggregated=l.is_aggregated,
            status=l.status,
            created_at=l.created_at,
            inspections=insp_responses
        ))
    return results


@router.post("/{lot_id}/inspections", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def add_inspection(
    lot_id: int,
    req: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adds a verified quality inspection report to a produce lot."""
    req.lot_id = lot_id
    inspection = ListingService.add_inspection(db, current_user, req)
    return inspection
