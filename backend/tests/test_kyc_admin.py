def test_kyc_submission_and_admin_approval(client, farmer_token, admin_token, farmer_user):
    f_headers = {"Authorization": f"Bearer {farmer_token}"}
    a_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Farmer submits KYC
    submit_res = client.post(
        "/api/v1/kyc/submit",
        headers=f_headers,
        json={
            "document_type": "AADHAAR",
            "document_number": "9021-3849-1122"
        }
    )
    assert submit_res.status_code == 201
    kyc_item = submit_res.json()
    assert kyc_item["status"] == "PENDING"
    assert kyc_item["document_number"] == "9021-3849-1122"

    # 2. Admin views pending queue
    pending_res = client.get("/api/v1/kyc/pending", headers=a_headers)
    assert pending_res.status_code == 200
    pending_list = pending_res.json()
    assert any(k["id"] == kyc_item["id"] for k in pending_list)

    # 3. Admin approves KYC
    review_res = client.put(
        f"/api/v1/kyc/{kyc_item['id']}/review",
        headers=a_headers,
        json={"status": "APPROVED", "remarks": "Aadhaar verified successfully."}
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"

    # 4. Verify farmer's status
    my_status = client.get("/api/v1/kyc/my-status", headers=f_headers).json()
    assert len(my_status) >= 1
    assert my_status[0]["status"] == "APPROVED"


def test_rbac_farmer_cannot_access_admin_endpoints(client, farmer_token):
    headers = {"Authorization": f"Bearer {farmer_token}"}
    res = client.get("/api/v1/admin/dashboard-stats", headers=headers)
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()
