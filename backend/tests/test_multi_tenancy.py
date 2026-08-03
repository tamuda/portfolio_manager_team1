"""Regression tests proving data is scoped per user, not shared globally."""


def test_holdings_scoped_by_user(client, auth_headers, other_auth_headers):
    create_response = client.post(
        "/api/v1/holdings",
        json={
            "ticker": "AAPL",
            "quantity_added": "10",
            "purchase_price": "150.00",
            "purchase_date": "2026-01-15",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 200

    owner_holdings = client.get("/api/v1/holdings", headers=auth_headers).json()
    assert len(owner_holdings) == 1
    assert owner_holdings[0]["ticker"] == "AAPL"

    other_holdings = client.get("/api/v1/holdings", headers=other_auth_headers).json()
    assert other_holdings == []


def test_holding_not_visible_or_mutable_by_other_user(client, auth_headers, other_auth_headers):
    create_response = client.post(
        "/api/v1/holdings",
        json={
            "ticker": "MSFT",
            "quantity_added": "5",
            "purchase_price": "300.00",
            "purchase_date": "2026-01-15",
        },
        headers=auth_headers,
    )
    holding_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/holdings/{holding_id}", headers=other_auth_headers)
    assert get_response.status_code == 404

    delete_response = client.delete(
        f"/api/v1/holdings/{holding_id}", headers=other_auth_headers
    )
    assert delete_response.status_code == 404

    still_there = client.get(f"/api/v1/holdings/{holding_id}", headers=auth_headers)
    assert still_there.status_code == 200


def test_watchlist_ticker_uniqueness_is_per_user(client, auth_headers, other_auth_headers):
    first = client.post(
        "/api/v1/watchlist", json={"ticker": "AAPL"}, headers=auth_headers
    )
    assert first.status_code == 200

    second = client.post(
        "/api/v1/watchlist", json={"ticker": "AAPL"}, headers=other_auth_headers
    )
    assert second.status_code == 200

    owner_watchlist = client.get("/api/v1/watchlist", headers=auth_headers).json()
    other_watchlist = client.get("/api/v1/watchlist", headers=other_auth_headers).json()
    assert len(owner_watchlist) == 1
    assert len(other_watchlist) == 1


def test_accounts_are_independent_per_user(client, auth_headers, other_auth_headers):
    client.post(
        "/api/v1/transactions/transfer",
        json={"direction": "DEPOSIT", "amount": "1000"},
        headers=auth_headers,
    )

    owner_account = client.get("/api/v1/account", headers=auth_headers).json()
    other_account = client.get("/api/v1/account", headers=other_auth_headers).json()
    assert owner_account["cash_balance"] == "1000.000000"
    assert other_account["cash_balance"] == "0.000000"
