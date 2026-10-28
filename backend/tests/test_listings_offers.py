def test_lot_creation_and_listing_workflow(client, farmer_token, test_commodity):
    headers = {"Authorization": f"Bearer {farmer_token}"}

    # 1. Farmer creates a produce lot
    res = client.post(
        "/api/v1/lots",
        headers=headers,
        json={
            "commodity_id": test_commodity.id,
            "quantity": 100.0,
            "unit": "Quintal",
            "variety": "Sharbati",
            "storage_type": "Farm Store",
            "district": "Indore",
            "state": "Madhya Pradesh"
        }
    )
    assert res.status_code == 201
    lot = res.json()
    assert lot["lot_code"].startswith("LOT-")
    assert lot["quantity"] == 100.0

    # 2. Farmer publishes a commercial listing from the lot
    res_list = client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "lot_id": lot["id"],
            "title": "Fresh Sharbati Wheat - Direct Harvest",
            "description": "Clean, sun-dried wheat",
            "commodity_id": test_commodity.id,
            "quantity_available": 100.0,
            "min_order_quantity": 10.0,
            "unit": "Quintal",
            "asking_price_per_unit": 2600.00,
            "quality_grade": "Grade A",
            "district": "Indore",
            "state": "Madhya Pradesh"
        }
    )
    assert res_list.status_code == 201
    listing = res_list.json()
    assert listing["title"] == "Fresh Sharbati Wheat - Direct Harvest"
    assert listing["status"] == "ACTIVE"

    # 3. Public search returns the listing
    res_search = client.get(f"/api/v1/listings?commodity_id={test_commodity.id}")
    assert res_search.status_code == 200
    items = res_search.json()
    assert len(items) >= 1
    assert items[0]["id"] == listing["id"]


def test_offer_submission_and_acceptance(client, farmer_token, buyer_token, test_commodity):
    # Setup Lot and Listing
    f_headers = {"Authorization": f"Bearer {farmer_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    lot_res = client.post(
        "/api/v1/lots",
        headers=f_headers,
        json={"commodity_id": test_commodity.id, "quantity": 150.0, "unit": "Quintal"}
    )
    lot_id = lot_res.json()["id"]

    list_res = client.post(
        "/api/v1/listings",
        headers=f_headers,
        json={
            "lot_id": lot_id,
            "title": "Bulk Wheat Supply",
            "commodity_id": test_commodity.id,
            "quantity_available": 150.0,
            "asking_price_per_unit": 2500.00,
            "quality_grade": "Grade A"
        }
    )
    listing_id = list_res.json()["id"]

    # Buyer submits an offer
    offer_res = client.post(
        "/api/v1/offers",
        headers=b_headers,
        json={
            "listing_id": listing_id,
            "offered_quantity": 50.0,
            "offered_price_per_unit": 2450.00,
            "notes": "Offer for immediate procurement"
        }
    )
    assert offer_res.status_code == 201
    offer = offer_res.json()
    assert offer["offered_quantity"] == 50.0
    assert float(offer["total_amount"]) == 122500.0

    # Farmer accepts the offer
    accept_res = client.put(
        f"/api/v1/offers/{offer['id']}/respond",
        headers=f_headers,
        json={"status": "ACCEPTED", "seller_notes": "Offer accepted. Ready for dispatch."}
    )
    assert accept_res.status_code == 200
    accepted_offer = accept_res.json()
    assert accepted_offer["status"] == "ACCEPTED"

    # Verify listing quantity was deducted automatically
    updated_listing = client.get(f"/api/v1/listings/{listing_id}").json()
    assert updated_listing["quantity_available"] == 100.0


def test_offer_exceeding_quantity_rejected(client, farmer_token, buyer_token, test_commodity):
    f_headers = {"Authorization": f"Bearer {farmer_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    lot_res = client.post(
        "/api/v1/lots",
        headers=f_headers,
        json={"commodity_id": test_commodity.id, "quantity": 50.0, "unit": "Quintal"}
    )
    list_res = client.post(
        "/api/v1/listings",
        headers=f_headers,
        json={
            "lot_id": lot_res.json()["id"],
            "title": "Small Lot",
            "commodity_id": test_commodity.id,
            "quantity_available": 50.0,
            "asking_price_per_unit": 2500.00
        }
    )

    # Attempt to offer 100 quintals on 50 quintal listing
    res = client.post(
        "/api/v1/offers",
        headers=b_headers,
        json={
            "listing_id": list_res.json()["id"],
            "offered_quantity": 100.0,
            "offered_price_per_unit": 2500.00
        }
    )
    assert res.status_code == 400
    assert "exceeds available quantity" in res.json()["detail"]
