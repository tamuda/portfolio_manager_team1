"""app.repositories.account_repository — auto-creation and per-user isolation."""

from decimal import Decimal

from app.repositories import account_repository


def test_get_account_creates_with_zero_balance_if_missing(db_session, test_user):
    account = account_repository.get_account(db_session, test_user)

    assert account.user_id == test_user.id
    assert account.cash_balance == Decimal("0")


def test_get_account_returns_same_account_on_repeated_calls(db_session, test_user):
    first = account_repository.get_account(db_session, test_user)
    second = account_repository.get_account(db_session, test_user)

    assert first.id == second.id


def test_get_account_is_isolated_per_user(db_session, test_user, other_user):
    account_a = account_repository.get_account(db_session, test_user)
    account_b = account_repository.get_account(db_session, other_user)

    assert account_a.id != account_b.id
    assert account_a.user_id == test_user.id
    assert account_b.user_id == other_user.id


def test_get_account_route_returns_zero_balance_for_new_user(client, auth_headers):
    response = client.get("/api/v1/account", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["cash_balance"] == "0.000000"


def test_get_account_route_returns_same_account_id_across_requests(client, auth_headers):
    first = client.get("/api/v1/account", headers=auth_headers).json()
    second = client.get("/api/v1/account", headers=auth_headers).json()

    assert first["id"] == second["id"]
