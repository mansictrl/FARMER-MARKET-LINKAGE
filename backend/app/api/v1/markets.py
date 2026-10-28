from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.core.exceptions import EntityNotFoundException
from app.models.market import Market
from app.models.user import User
from app.schemas.market_price import MarketResponse

router = APIRouter(prefix="/markets", tags=["APMC Markets"])


@router.get("", response_model=List[MarketResponse])
def get_markets(
    state: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves all registered APMC mandis and agricultural markets."""
    query = db.query(Market)
    if state:
        query = query.filter(Market.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Market.district.ilike(f"%{district}%"))
    return query.order_by(Market.state, Market.name).all()


@router.get("/{market_id}", response_model=MarketResponse)
def get_market_by_id(market_id: int, db: Session = Depends(get_db)):
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise EntityNotFoundException("Market", market_id)
    return market
