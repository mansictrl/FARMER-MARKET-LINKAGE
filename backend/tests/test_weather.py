from fastapi.testclient import TestClient
from app.integrations.weather_maps import WeatherAdapter

def test_weather_adapter_direct():
    """Verify WeatherAdapter returns structured live meteorological data for Nashik"""
    data = WeatherAdapter.get_district_weather(district="Nashik", state="Maharashtra")
    assert data["district"] == "Nashik"
    assert "temperature_celsius" in data
    assert "humidity_percentage" in data
    assert "harvest_suitability" in data
    assert "storage_humidity_risk" in data
    assert "forecast" in data
    assert len(data["forecast"]) >= 1

def test_weather_api_endpoint(client: TestClient):
    """Verify GET /api/v1/weather endpoint responds with 200 OK and valid schema"""
    response = client.get("/api/v1/weather?district=Nashik&state=Maharashtra")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["district"] == "Nashik"
    assert "temperature_celsius" in json_data
    assert "harvest_suitability" in json_data
    assert "storage_humidity_risk" in json_data
    assert "forecast" in json_data
