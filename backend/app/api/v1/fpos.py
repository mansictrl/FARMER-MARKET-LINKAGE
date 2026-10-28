from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_fpo
from app.models.user import User
from app.schemas.fpo import (
    FPOMemberAddRequest, FPOMemberResponse,
    FPOAggregationRequest, FPOAggregationResponse
)
from app.services.fpo_service import FPOService

router = APIRouter(prefix="/fpos", tags=["FPO Collective Aggregation"])


@router.get("/members", response_model=List[FPOMemberResponse])
def get_fpo_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_fpo)
):
    """Retrieves all affiliated smallholder farmers enrolled in this FPO."""
    return FPOService.get_members(db, current_user)


@router.post("/members", response_model=FPOMemberResponse, status_code=status.HTTP_201_CREATED)
def add_fpo_member(
    req: FPOMemberAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_fpo)
):
    """Enrolls a farmer into the FPO registry with shareholding records."""
    return FPOService.add_member(db, current_user, req)


@router.post("/aggregate-lots", response_model=FPOAggregationResponse, status_code=status.HTTP_201_CREATED)
def aggregate_produce_lots(
    req: FPOAggregationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_fpo)
):
    """
    Combines produce from multiple member farmers into a single bulk commercial lot,
    retaining full traceability back to individual contributing farmers.
    """
    return FPOService.aggregate_lots(db, current_user, req)
