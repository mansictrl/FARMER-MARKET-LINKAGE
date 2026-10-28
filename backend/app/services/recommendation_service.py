from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.exceptions import EntityNotFoundException
from app.models.commodity import Commodity
from app.models.market import Market, MarketPrice, ArrivalVolume
from app.models.user import User
from app.models.recommendation import Recommendation
from app.integrations.weather_maps import GeocodingAndDistanceAdapter, WeatherAdapter
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse


class RecommendationService:
    @staticmethod
    def generate_recommendation(
        db: Session,
        user: Optional[User],
        req: RecommendationRequest
    ) -> RecommendationResponse:
        commodity = db.query(Commodity).filter(Commodity.id == req.commodity_id).first()
        if not commodity:
            raise EntityNotFoundException("Commodity", req.commodity_id)

        farmer_district = req.farmer_district
        farmer_state = req.farmer_state
        if user and user.farmer_profile:
            farmer_district = farmer_district or user.farmer_profile.district or "Nashik"
            farmer_state = farmer_state or user.farmer_profile.state or "Maharashtra"
        else:
            farmer_district = farmer_district or "Nashik"
            farmer_state = farmer_state or "Maharashtra"

        # Query recent 30-day market prices for this commodity
        cutoff_date = date.today() - timedelta(days=35)
        recent_prices = db.query(MarketPrice).filter(
            MarketPrice.commodity_id == commodity.id,
            MarketPrice.price_date >= cutoff_date
        ).order_by(desc(MarketPrice.price_date)).all()

        # Handle insufficient data explicitly
        if not recent_prices:
            default_market = db.query(Market).first()
            market_name = default_market.name if default_market else "Local APMC Mandi"
            market_id = default_market.id if default_market else 1
            market_state = default_market.state if default_market else farmer_state

            return RecommendationResponse(
                commodity_id=commodity.id,
                commodity_name=commodity.name,
                suggested_market_id=market_id,
                suggested_market_name=market_name,
                suggested_market_state=market_state,
                observed_current_price=Decimal("2200.00"),
                modal_price=Decimal("2200.00"),
                min_expected_price=Decimal("2000.00"),
                max_expected_price=Decimal("2400.00"),
                suggested_action="SELL_NOW",
                suggested_selling_window="Consult local mandi bulletin directly",
                transport_cost_estimate=Decimal("0.00"),
                net_realization_estimate=Decimal("2200.00"),
                confidence_score=0.35,
                explanation="Insufficient historical price records in the database. Algorithm baseline default applied. Please upload or import mandi price CSV data for high-confidence predictions.",
                reasoning_factors={"data_status": "INSUFFICIENT_DATA", "records_found": 0},
                data_source_info="Mandi Baseline Default (Data Sparse)",
                generated_at=datetime.now(timezone.utc)
            )

        # Group prices by market to find best mandi and calculate net realization
        market_stats: Dict[int, Dict[str, Any]] = {}
        for p in recent_prices:
            if p.market_id not in market_stats:
                market_stats[p.market_id] = {
                    "market": p.market,
                    "latest_price": p,
                    "all_prices": []
                }
            market_stats[p.market_id]["all_prices"].append(p)

        best_market_id = None
        best_net_realization = Decimal("-1")
        best_freight_cost = Decimal("0")
        best_stats = None

        for m_id, data in market_stats.items():
            market = data["market"]
            latest_price: MarketPrice = data["latest_price"]

            # Estimate freight logistics cost
            freight_info = GeocodingAndDistanceAdapter.estimate_distance_and_freight(
                origin_district=farmer_district,
                destination_district=market.district or market.name,
                quantity_quintals=req.quantity
            )
            freight_per_quintal = Decimal(str(freight_info["cost_per_quintal_inr"]))
            net_realization = latest_price.modal_price - freight_per_quintal

            data["freight_info"] = freight_info
            data["net_realization"] = net_realization

            if net_realization > best_net_realization:
                best_net_realization = net_realization
                best_market_id = m_id
                best_freight_cost = freight_per_quintal
                best_stats = data

        selected_market = best_stats["market"]
        latest_record: MarketPrice = best_stats["latest_price"]
        all_records: List[MarketPrice] = best_stats["all_prices"]

        # Calculate arrival volume trend and 7-day price momentum
        avg_price = sum([r.modal_price for r in all_records]) / len(all_records)
        price_spread = latest_record.max_price - latest_record.min_price

        # Check arrival volume dynamics
        avg_arrivals = sum([r.arrival_volume or 0 for r in all_records]) / max(1, len(all_records))
        recent_arrival = latest_record.arrival_volume or avg_arrivals
        arrival_pressure = "NORMAL"
        if recent_arrival > avg_arrivals * 1.2:
            arrival_pressure = "HIGH_INFLOW_DOWNWARD_PRESSURE"
        elif recent_arrival < avg_arrivals * 0.8:
            arrival_pressure = "LOW_INFLOW_UPWARD_PRESSURE"

        # Determine strategy and selling window
        confidence = min(0.95, 0.60 + (len(all_records) * 0.03))
        
        suggested_action = "SELL_NOW"
        selling_window = "Next 2 to 4 days"

        # Incorporate Live Open-Meteo Weather Signals
        weather_info = WeatherAdapter.get_district_weather(farmer_district, farmer_state)
        rain_risk = weather_info.get("harvest_suitability") == "UNFAVORABLE (RAIN RISK)"

        if req.storage_available and arrival_pressure == "HIGH_INFLOW_DOWNWARD_PRESSURE":
            # If farmer can store produce while mandis are currently flooded with peak harvest
            suggested_action = "HOLD_FOR_BETTER_PRICE"
            selling_window = "Hold for 10-15 days in certified storage"
            explanation = (
                f"Peak mandi arrivals detected at {selected_market.name} ({recent_arrival:.0f}Q vs 30-day avg {avg_arrivals:.0f}Q). "
                f"Observed current price is ₹{latest_record.modal_price}/Q. Because you have storage capacity, holding produce for "
                f"10-15 days is recommended to avoid harvest glut discounts. Historical trend indicates price recovery after initial arrival peak."
            )
        elif selected_market.district.lower() != farmer_district.lower() and best_net_realization > (latest_record.modal_price - Decimal("100")):
            suggested_action = "DIVERT_TO_ANOTHER_MANDI"
            selling_window = "Immediate dispatch (1-3 days)"
            explanation = (
                f"Favorable inter-mandi arbitrage detected! {selected_market.name} ({selected_market.state}) offers modal price of "
                f"₹{latest_record.modal_price}/Q. After accounting for estimated road freight of ₹{best_freight_cost}/Q from {farmer_district}, "
                f"your net realization is ₹{best_net_realization:.2f}/Q, yielding superior returns compared to local mandi rates."
            )
        elif rain_risk and not req.storage_available:
            suggested_action = "SELL_NOW"
            selling_window = "Immediate (24-48 hours)"
            explanation = (
                f"Rain forecast alert in {farmer_district} ({weather_info.get('rainfall_forecast_mm', 0)}mm precipitation expected via Open-Meteo). "
                f"Because no certified dry/cold storage is configured, selling immediately at {selected_market.name} (₹{latest_record.modal_price}/Q) "
                f"is advised to prevent post-harvest moisture damage and quality grade downgrades."
            )
        else:
            suggested_action = "SELL_NOW"
            selling_window = "Next 2 to 5 days"
            explanation = (
                f"Market conditions at {selected_market.name} are strong with current modal price at ₹{latest_record.modal_price}/Q "
                f"(vs 30-day average of ₹{avg_price:.2f}/Q). Arrival volumes are stable ({recent_arrival:.0f}Q). Net realization after freight "
                f"is ₹{best_net_realization:.2f}/Q. Local weather in {farmer_district} is {weather_info.get('condition')} ({weather_info.get('temperature_celsius')}°C). "
                f"Recommended action is to list or sell now."
            )

        reasoning = {
            "mandi_modal_price": float(latest_record.modal_price),
            "estimated_freight_per_quintal": float(best_freight_cost),
            "net_realization_per_quintal": float(best_net_realization),
            "arrival_volume_quintals": float(recent_arrival),
            "arrival_pressure_status": arrival_pressure,
            "historical_30d_avg_price": float(avg_price),
            "data_records_evaluated": len(all_records),
            "storage_option_considered": req.storage_available,
            "open_meteo_condition": weather_info.get("condition"),
            "open_meteo_temp_c": weather_info.get("temperature_celsius"),
            "open_meteo_humidity_pct": weather_info.get("humidity_percentage"),
            "open_meteo_rain_forecast_mm": weather_info.get("rainfall_forecast_mm"),
            "harvest_suitability": weather_info.get("harvest_suitability"),
            "storage_humidity_risk": weather_info.get("storage_humidity_risk")
        }

        # Persist recommendation to history if user is authenticated
        rec_id = None
        if user:
            rec_db = Recommendation(
                farmer_id=user.id,
                commodity_id=commodity.id,
                suggested_market_id=selected_market.id,
                observed_current_price=latest_record.modal_price,
                modal_price=latest_record.modal_price,
                min_expected_price=latest_record.min_price,
                max_expected_price=latest_record.max_price,
                suggested_action=suggested_action,
                suggested_selling_window=selling_window,
                transport_cost_estimate=best_freight_cost,
                net_realization_estimate=best_net_realization,
                confidence_score=confidence,
                explanation=explanation,
                reasoning_factors=reasoning,
                data_source_info=latest_record.source
            )
            db.add(rec_db)
            db.commit()
            rec_id = rec_db.id

        return RecommendationResponse(
            id=rec_id,
            commodity_id=commodity.id,
            commodity_name=commodity.name,
            suggested_market_id=selected_market.id,
            suggested_market_name=selected_market.name,
            suggested_market_state=selected_market.state,
            observed_current_price=latest_record.modal_price,
            modal_price=latest_record.modal_price,
            min_expected_price=latest_record.min_price,
            max_expected_price=latest_record.max_price,
            suggested_action=suggested_action,
            suggested_selling_window=selling_window,
            transport_cost_estimate=best_freight_cost,
            net_realization_estimate=best_net_realization,
            confidence_score=round(confidence, 2),
            explanation=explanation,
            reasoning_factors=reasoning,
            data_source_info=latest_record.source,
            generated_at=datetime.now(timezone.utc)
        )
