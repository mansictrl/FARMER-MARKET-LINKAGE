from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class DailyForecastItem(BaseModel):
    date: str
    max_temp: float
    min_temp: float
    precipitation_mm: float
    condition: str


class WeatherResponse(BaseModel):
    district: str
    state: str
    latitude: float
    longitude: float
    temperature_celsius: float
    temp_min_celsius: float
    temp_max_celsius: float
    humidity_percentage: int
    precipitation_mm: float
    rainfall_forecast_mm: float
    wind_speed_kmh: float
    weather_code: int
    condition: str
    harvest_suitability: str
    storage_humidity_risk: str
    source: str
    forecast: List[DailyForecastItem] = []
