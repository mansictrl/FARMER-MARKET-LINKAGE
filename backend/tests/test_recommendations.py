def test_recommendation_generation(client, farmer_token, test_commodity):
    headers = {"Authorization": f"Bearer {farmer_token}"}
    res = client.post(
        "/api/v1/recommendations",
        headers=headers,
        json={
            "commodity_id": test_commodity.id,
            "quantity": 100.0,
            "farmer_district": "Indore",
            "farmer_state": "Madhya Pradesh",
            "storage_available": True
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["commodity_id"] == test_commodity.id
    assert data["suggested_action"] in ["SELL_NOW", "HOLD_FOR_BETTER_PRICE", "DIVERT_TO_ANOTHER_MANDI"]
    assert float(data["modal_price"]) > 0
    assert float(data["net_realization_estimate"]) > 0
    assert data["confidence_score"] >= 0.5
    assert len(data["explanation"]) > 20
    assert "mandi_modal_price" in data["reasoning_factors"]


def test_recommendation_sparse_data_fallback(client, farmer_token, db_session):
    from app.models.commodity import Commodity
    # Create empty commodity with no price records
    empty_comm = Commodity(name="Rare Saffron", code="SAFFRON", category="Spice", standard_unit="Kg")
    db_session.add(empty_comm)
    db_session.commit()

    headers = {"Authorization": f"Bearer {farmer_token}"}
    res = client.post(
        "/api/v1/recommendations",
        headers=headers,
        json={"commodity_id": empty_comm.id, "quantity": 5.0}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["confidence_score"] <= 0.40
    assert "Insufficient historical price records" in data["explanation"]
