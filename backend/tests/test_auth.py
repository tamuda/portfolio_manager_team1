def test_register_creates_user_and_returns_token(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "newpassword123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]

    account_response = client.get(
        "/api/v1/account",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert account_response.status_code == 200
    assert account_response.json()["cash_balance"] == "0.000000"


def test_register_duplicate_email_rejected(client, test_user):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": test_user.email, "password": "somepassword123"},
    )
    assert response.status_code == 409


def test_login_success(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "testpassword123"},
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_wrong_password(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "whatever123"},
    )
    assert response.status_code == 401


def test_protected_route_rejects_unauthenticated(client):
    response = client.get("/api/v1/account")
    assert response.status_code == 401


def test_protected_route_rejects_invalid_token(client):
    response = client.get(
        "/api/v1/account", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers, test_user):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == test_user.id
    assert body["email"] == test_user.email


def test_register_rejects_password_shorter_than_8_characters(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "shortpass@example.com", "password": "short1"},
    )
    assert response.status_code == 422


def test_register_rejects_malformed_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "validpassword123"},
    )
    assert response.status_code == 422


def test_protected_route_rejects_token_for_deleted_user(
    client, db_session, test_user, auth_headers
):
    db_session.delete(test_user)
    db_session.commit()

    response = client.get("/api/v1/account", headers=auth_headers)
    assert response.status_code == 401
