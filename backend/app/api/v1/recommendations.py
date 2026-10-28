from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Price Recommendation Engine"])


@router.post("", response_model=RecommendationResponse)
def get_recommendation(
    req: RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Computes an explainable, data-driven selling recommendation:
    - Analyzes 30-day modal price trends & arrival pressure
    - Calculates distance & net freight cost per quintal across regional APMCs
    - Factors in storage availability to advise SELL NOW vs HOLD
    - Provides transparent rationale and confidence metrics
    """
    return RecommendationService.generate_recommendation(db, current_user, req)


@router.get("/history", response_model=List[RecommendationResponse])
def get_recommendation_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns past algorithmic recommendations generated for the current farmer."""
    recs = db.query(Recommendation).filter(Recommendation.farmer_id == current_user.id).order_by(desc(Recommendation.created_at)).limit(20).all()
    results = []
    for r in recs:
        results.append(RecommendationResponse(
            id=r.id,
            commodity_id=r.commodity_id,
            commodity_name=r.commodity.name if r.commodity else "Commodity",
            suggested_market_id=r.suggested_market_id,
            suggested_market_name=r.suggested_market.name if r.suggested_market else "Mandi",
            suggested_market_state=r.suggested_market.state if r.suggested_market else "State",
            observed_current_price=r.observed_current_price,
            modal_price=r.modal_price,
            min_expected_price=r.min_expected_price,
            max_expected_price=r.max_expected_price,
            suggested_action=r.suggested_action,
            suggested_selling_window=r.suggested_selling_window,
            transport_cost_estimate=r.transport_cost_estimate,
            net_realization_estimate=r.net_realization_estimate,
            confidence_score=r.confidence_score,
            explanation=r.explanation,
            reasoning_factors=r.reasoning_factors or {},
            data_source_info=r.data_source_info,
            generated_at=r.created_at
        ))
    return results
