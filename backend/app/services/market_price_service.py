from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func

from app.core.exceptions import EntityNotFoundException
from app.models.commodity import Commodity
from app.models.market import Market, MarketPrice
from app.schemas.market_price import (
    MarketPriceResponse, PriceComparisonResponse, PriceComparisonItem,
    HistoricalTrendPoint, CSVPriceImportResult
)
from app.integrations.market_data import CSVMarketDataImporter, MarketDataRecord


class MarketPriceService:
    @staticmethod
    def get_latest_prices(
        db: Session,
        commodity_id: Optional[int] = None,
        market_id: Optional[int] = None,
        state: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[MarketPriceResponse], int]:
        query = db.query(MarketPrice)

        if commodity_id:
            query = query.filter(MarketPrice.commodity_id == commodity_id)
        if market_id:
            query = query.filter(MarketPrice.market_id == market_id)
        if state:
            query = query.join(Market).filter(Market.state.ilike(f"%{state}%"))

        total = query.count()
        records = query.order_by(desc(MarketPrice.price_date)).offset((page - 1) * page_size).limit(page_size).all()

        responses = []
        for r in records:
            responses.append(MarketPriceResponse(
                id=r.id,
                commodity_id=r.commodity_id,
                commodity_name=r.commodity.name if r.commodity else None,
                market_id=r.market_id,
                market_name=r.market.name if r.market else None,
                state=r.market.state if r.market else None,
                district=r.market.district if r.market else None,
                price_date=r.price_date,
                min_price=r.min_price,
                max_price=r.max_price,
                modal_price=r.modal_price,
                arrival_volume=r.arrival_volume,
                unit=r.unit,
                source=r.source,
                updated_at=r.updated_at
            ))
        return responses, total

    @staticmethod
    def get_historical_trends(
        db: Session,
        commodity_id: int,
        market_id: Optional[int] = None,
        days: int = 30
    ) -> List[HistoricalTrendPoint]:
        commodity = db.query(Commodity).filter(Commodity.id == commodity_id).first()
        if not commodity:
            raise EntityNotFoundException("Commodity", commodity_id)

        cutoff = date.today() - timedelta(days=days)
        query = db.query(MarketPrice).filter(
            MarketPrice.commodity_id == commodity_id,
            MarketPrice.price_date >= cutoff
        )

        if market_id:
            query = query.filter(MarketPrice.market_id == market_id)

        prices = query.order_by(asc(MarketPrice.price_date)).all()
        points: List[HistoricalTrendPoint] = []
        
        # Aggregate by date if multiple mandis are matched
        by_date: Dict[str, List[MarketPrice]] = {}
        for p in prices:
            d_str = p.price_date.strftime("%Y-%m-%d")
            by_date.setdefault(d_str, []).append(p)

        for d_str, records in by_date.items():
            avg_min = sum([float(r.min_price) for r in records]) / len(records)
            avg_max = sum([float(r.max_price) for r in records]) / len(records)
            avg_modal = sum([float(r.modal_price) for r in records]) / len(records)
            tot_vol = sum([float(r.arrival_volume or 0) for r in records])
            points.append(HistoricalTrendPoint(
                date=d_str,
                min_price=round(avg_min, 2),
                max_price=round(avg_max, 2),
                modal_price=round(avg_modal, 2),
                arrival_volume=round(tot_vol, 1)
            ))
        return points

    @staticmethod
    def compare_prices_across_mandis(db: Session, commodity_id: int) -> PriceComparisonResponse:
        commodity = db.query(Commodity).filter(Commodity.id == commodity_id).first()
        if not commodity:
            raise EntityNotFoundException("Commodity", commodity_id)

        # Get latest price for each market
        subquery = (
            db.query(
                MarketPrice.market_id,
                func.max(MarketPrice.price_date).label("max_date")
            )
            .filter(MarketPrice.commodity_id == commodity_id)
            .group_by(MarketPrice.market_id)
            .subquery()
        )

        latest_prices = (
            db.query(MarketPrice)
            .join(
                subquery,
                (MarketPrice.market_id == subquery.c.market_id)
                & (MarketPrice.price_date == subquery.c.max_date)
            )
            .filter(MarketPrice.commodity_id == commodity_id)
            .all()
        )

        if not latest_prices:
            return PriceComparisonResponse(
                commodity_id=commodity.id,
                commodity_name=commodity.name,
                reference_date=str(date.today()),
                average_modal_price=Decimal("0.00"),
                markets=[]
            )

        items: List[PriceComparisonItem] = []
        highest_price = Decimal("-1")
        highest_market = None
        lowest_price = Decimal("9999999")
        lowest_market = None
        total_modal = Decimal("0")

        for p in latest_prices:
            total_modal += p.modal_price
            if p.modal_price > highest_price:
                highest_price = p.modal_price
                highest_market = p.market.name
            if p.modal_price < lowest_price:
                lowest_price = p.modal_price
                lowest_market = p.market.name

            items.append(PriceComparisonItem(
                market_id=p.market.id,
                market_name=p.market.name,
                state=p.market.state,
                district=p.market.district,
                modal_price=p.modal_price,
                min_price=p.min_price,
                max_price=p.max_price,
                arrival_volume=p.arrival_volume or 0.0,
                source=p.source,
                last_updated=p.price_date.strftime("%Y-%m-%d")
            ))

        avg_modal = round(total_modal / len(latest_prices), 2)
        return PriceComparisonResponse(
            commodity_id=commodity.id,
            commodity_name=commodity.name,
            reference_date=str(date.today()),
            average_modal_price=avg_modal,
            highest_market=highest_market,
            highest_price=highest_price if highest_market else None,
            lowest_market=lowest_market,
            lowest_price=lowest_price if lowest_market else None,
            markets=items
        )

    @staticmethod
    def import_from_csv(db: Session, csv_content: str) -> CSVPriceImportResult:
        records = CSVMarketDataImporter.parse_csv(csv_content)
        inserted = 0
        updated = 0
        errors = []

        for item in records:
            try:
                # Find or create commodity
                comm = db.query(Commodity).filter(Commodity.name.ilike(item.commodity)).first()
                if not comm:
                    comm_code = item.commodity.upper().replace(" ", "_")[:10]
                    comm = Commodity(name=item.commodity, code=comm_code, category="General", standard_unit=item.unit)
                    db.add(comm)
                    db.flush()

                # Find or create market
                mkt = db.query(Market).filter(Market.name.ilike(item.market)).first()
                if not mkt:
                    mkt = Market(name=item.market, state=item.state or "India", district=item.district or "General", is_apmc=True)
                    db.add(mkt)
                    db.flush()

                # Upsert price record
                existing = db.query(MarketPrice).filter(
                    MarketPrice.commodity_id == comm.id,
                    MarketPrice.market_id == mkt.id,
                    MarketPrice.price_date == item.price_date
                ).first()

                if existing:
                    existing.min_price = item.min_price
                    existing.max_price = item.max_price
                    existing.modal_price = item.modal_price
                    existing.arrival_volume = item.arrival_volume
                    existing.source = item.source
                    updated += 1
                else:
                    new_price = MarketPrice(
                        commodity_id=comm.id,
                        market_id=mkt.id,
                        price_date=item.price_date,
                        min_price=item.min_price,
                        max_price=item.max_price,
                        modal_price=item.modal_price,
                        arrival_volume=item.arrival_volume,
                        unit=item.unit,
                        source=item.source
                    )
                    db.add(new_price)
                    inserted += 1
            except Exception as e:
                errors.append(f"Error on {item.commodity} at {item.market}: {str(e)}")

        db.commit()
        return CSVPriceImportResult(
            total_records_processed=len(records),
            inserted_records=inserted,
            updated_records=updated,
            errors=errors[:10],
            source="CSV File Import"
        )
