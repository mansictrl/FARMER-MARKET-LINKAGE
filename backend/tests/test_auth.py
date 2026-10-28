def test_register_farmer(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new.farmer@example.com",
            "password": "FarmerPassword123",
            "full_name": "Suresh Kisan",
            "phone": "9811223344",
            "role": "farmer",
            "state": "Maharashtra",
            "district": "Nashik"
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new.farmer@example.com"
    assert data["role"] == "farmer"
    assert data["farmer_profile"]["district"] == "Nashik"


def test_login_success(client, farmer_user):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test.farmer@example.com",
            "password": "Secret123"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "farmer"
    assert data["user_id"] == farmer_user.id


def test_login_invalid_credentials(client):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "WrongPassword"
        }
    )
    assert res.status_code == 400
    assert "Incorrect email or password" in res.json()["detail"]


def test_get_current_user_profile(client, farmer_token):
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test.farmer@example.com"
    assert data["role"] == "farmer"


def test_unauthorized_access_fails(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
