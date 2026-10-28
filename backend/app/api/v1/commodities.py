from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException
from app.models.commodity import Commodity, QualityGrade
from app.models.user import User
from app.schemas.commodity import CommodityCreate, CommodityResponse, QualityGradeResponse

router = APIRouter(prefix="/commodities", tags=["Commodities"])


@router.get("", response_model=List[CommodityResponse])
def get_commodities(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves all agricultural commodities supported on the marketplace."""
    query = db.query(Commodity)
    if category:
        query = query.filter(Commodity.category.ilike(category))
    return query.order_by(Commodity.name).all()


@router.get("/{commodity_id}", response_model=CommodityResponse)
def get_commodity_by_id(commodity_id: int, db: Session = Depends(get_db)):
    comm = db.query(Commodity).filter(Commodity.id == commodity_id).first()
    if not comm:
        raise EntityNotFoundException("Commodity", commodity_id)
    return comm


@router.post("", response_model=CommodityResponse, status_code=status.HTTP_201_CREATED)
def create_commodity(
    req: CommodityCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin-only endpoint to add a new commodity to the platform catalog."""
    existing = db.query(Commodity).filter(Commodity.code == req.code).first()
    if existing:
        raise DuplicateResourceException("Commodity", "code", req.code)

    comm = Commodity(
        name=req.name,
        code=req.code,
        category=req.category,
        standard_unit=req.standard_unit,
        min_support_price=req.min_support_price,
        shelf_life_days=req.shelf_life_days,
        image_url=req.image_url,
        description=req.description
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)
    return comm
