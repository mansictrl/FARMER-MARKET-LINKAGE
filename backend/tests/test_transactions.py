def test_transaction_full_lifecycle(client, farmer_token, buyer_token, test_commodity):
    f_headers = {"Authorization": f"Bearer {farmer_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 1. Setup listing and offer
    lot_res = client.post("/api/v1/lots", headers=f_headers, json={"commodity_id": test_commodity.id, "quantity": 100.0})
    list_res = client.post("/api/v1/listings", headers=f_headers, json={
        "lot_id": lot_res.json()["id"],
        "title": "Wheat For Escrow Test",
        "commodity_id": test_commodity.id,
        "quantity_available": 100.0,
        "asking_price_per_unit": 2500.00
    })
    offer_res = client.post("/api/v1/offers", headers=b_headers, json={
        "listing_id": list_res.json()["id"],
        "offered_quantity": 40.0,
        "offered_price_per_unit": 2500.00
    })
    offer_id = offer_res.json()["id"]

    # 2. Accept offer -> Transaction is automatically created
    client.put(f"/api/v1/offers/{offer_id}/respond", headers=f_headers, json={"status": "ACCEPTED"})

    # 3. Buyer views transactions
    txns_res = client.get("/api/v1/transactions", headers=b_headers)
    assert txns_res.status_code == 200
    txns = txns_res.json()
    assert len(txns) >= 1
    txn = txns[0]
    assert txn["agreed_quantity"] == 40.0
    assert txn["payment_status"] == "PENDING"
    assert txn["fulfillment_status"] == "ORDER_PLACED"

    # 4. Initiate payment order
    pay_init = client.post(
        "/api/v1/transactions/payments/initiate",
        headers=b_headers,
        json={"transaction_id": txn["id"], "payment_method": "RAZORPAY_TEST"}
    )
    assert pay_init.status_code == 201
    payment = pay_init.json()
    assert payment["payment_gateway_order_id"] is not None

    # 5. Verify payment with test sandbox signature -> Funds locked in escrow
    pay_verify = client.post(
        "/api/v1/transactions/payments/verify",
        headers=b_headers,
        json={
            "payment_id": payment["id"],
            "razorpay_order_id": payment["payment_gateway_order_id"],
            "razorpay_payment_id": "pay_test_sandbox_123",
            "razorpay_signature": "test_sig_mock_signature"
        }
    )
    assert pay_verify.status_code == 200
    assert pay_verify.json()["status"] == "SUCCESS"

    # Transaction payment status should now be ESCROW_FUNDED
    updated_txn = client.get(f"/api/v1/transactions/{txn['id']}", headers=b_headers).json()
    assert updated_txn["payment_status"] == "ESCROW_FUNDED"

    # 6. Fulfillment progression: ORDER_PLACED -> IN_TRANSIT
    prog_1 = client.put(
        f"/api/v1/transactions/{txn['id']}/status",
        headers=f_headers,
        json={"fulfillment_status": "IN_TRANSIT"}
    )
    assert prog_1.status_code == 200
    assert prog_1.json()["fulfillment_status"] == "IN_TRANSIT"

    # 7. Fulfillment progression: IN_TRANSIT -> DELIVERED
    prog_2 = client.put(
        f"/api/v1/transactions/{txn['id']}/status",
        headers=b_headers,
        json={"fulfillment_status": "DELIVERED"}
    )
    assert prog_2.status_code == 200
    assert prog_2.json()["fulfillment_status"] == "DELIVERED"

    # 8. Complete transaction -> Escrow payment released to seller
    prog_3 = client.put(
        f"/api/v1/transactions/{txn['id']}/status",
        headers=b_headers,
        json={"fulfillment_status": "COMPLETED"}
    )
    assert prog_3.status_code == 200
    final_txn = prog_3.json()
    assert final_txn["fulfillment_status"] == "COMPLETED"
    assert final_txn["payment_status"] == "RELEASED"

    # 9. Buyer submits review
    rev_res = client.post(
        "/api/v1/transactions/reviews",
        headers=b_headers,
        json={"transaction_id": txn["id"], "rating": 5, "comment": "Excellent quality wheat and swift delivery!"}
    )
    assert rev_res.status_code == 201
    assert rev_res.json()["rating"] == 5
