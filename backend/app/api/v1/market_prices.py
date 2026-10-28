from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.schemas.market_price import (
    MarketPriceResponse, PriceComparisonResponse,
    HistoricalTrendPoint, CSVPriceImportResult
)
from app.services.market_price_service import MarketPriceService

router = APIRouter(prefix="/market-prices", tags=["Market Price Discovery"])


@router.get("", response_model=List[MarketPriceResponse])
def get_market_prices(
    commodity_id: Optional[int] = None,
    market_id: Optional[int] = None,
    state: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Fetches verified APMC mandi prices with min, max, and modal rates."""
    records, total = MarketPriceService.get_latest_prices(
        db,
        commodity_id=commodity_id,
        market_id=market_id,
        state=state,
        page=page,
        page_size=page_size
    )
    return records


@router.get("/historical", response_model=List[HistoricalTrendPoint])
def get_historical_trends(
    commodity_id: int,
    market_id: Optional[int] = None,
    days: int = Query(30, ge=7, le=180),
    db: Session = Depends(get_db)
):
    """Returns historical daily min, max, and modal price time-series for Recharts visualisations."""
    return MarketPriceService.get_historical_trends(db, commodity_id, market_id, days)


@router.get("/compare", response_model=PriceComparisonResponse)
def compare_prices(
    commodity_id: int,
    db: Session = Depends(get_db)
):
    """Compares price realisations across all state APMC mandis for a given commodity."""
    return MarketPriceService.compare_prices_across_mandis(db, commodity_id)


@router.post("/import-csv", response_model=CSVPriceImportResult)
async def import_csv_prices(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    """Admin endpoint to bulk import official Agmarknet / APMC Mandi daily CSV prices."""
    content = await file.read()
    csv_text = content.decode("utf-8", errors="ignore")
    return MarketPriceService.import_from_csv(db, csv_text)
