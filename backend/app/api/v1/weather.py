from typing import Optional
from fastapi import APIRouter, Query, Depends
from app.integrations.weather_maps import WeatherAdapter
from app.schemas.weather import WeatherResponse
from app.models.user import User
from app.core.dependencies import get_current_user_optional

router = APIRouter(prefix="/weather", tags=["Agro-Weather"])


@router.get("", response_model=WeatherResponse)
def get_weather_forecast(
    district: Optional[str] = Query(None, description="Agricultural district name, e.g. Nashik, Indore"),
    state: Optional[str] = Query(None, description="State name, e.g. Maharashtra, Madhya Pradesh"),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Fetches real-time agro-meteorological weather and forecasts from the Open-Meteo API.
    Calculates harvest suitability and storage risk for farmers.
    """
    target_district = district
    target_state = state

    # If parameters not explicitly provided, pull from logged-in user profile
    if not target_district and current_user:
        if current_user.farmer_profile and current_user.farmer_profile.district:
            target_district = current_user.farmer_profile.district
            target_state = current_user.farmer_profile.state or "Maharashtra"
        elif current_user.buyer_profile and current_user.buyer_profile.district:
            target_district = current_user.buyer_profile.district
            target_state = current_user.buyer_profile.state or "Maharashtra"

    target_district = target_district or "Nashik"
    target_state = target_state or "Maharashtra"

    weather_data = WeatherAdapter.get_district_weather(target_district, target_state)
    return weather_data
