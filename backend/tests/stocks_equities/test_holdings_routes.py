"""Holdings routes: validation errors, 404s (including IDOR), and the
/performance + /summary aggregation endpoints.
"""

from decimal import Decimal

from app.services.market_data_service import MarketDataError


def _create_holding(client, headers, **overrides):
    payload = {
        "ticker": "AAPL",
        "quantity_added": "10",
        "purchase_price": "100",
        "purchase_date": "2026-01-01",
    }
    payload.update(overrides)
    return client.post("/api/v1/holdings", json=payload, headers=headers)


# --- create/update validation errors (422) ----------------------------------------


def test_create_holding_missing_purchase_date_returns_422(client, auth_headers):
    payload = {"ticker": "AAPL", "quantity_added": "10", "purchase_price": "100"}
    response = client.post("/api/v1/holdings", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_create_holding_zero_quantity_returns_422(client, auth_headers):
    response = _create_holding(client, auth_headers, quantity_added="0")
    assert response.status_code == 422


def test_create_holding_negative_quantity_returns_422(client, auth_headers):
    response = _create_holding(client, auth_headers, quantity_added="-5")
    assert response.status_code == 422


def test_create_holding_negative_purchase_price_returns_422(client, auth_headers):
    response = _create_holding(client, auth_headers, purchase_price="-1")
    assert response.status_code == 422


def test_create_holding_empty_ticker_returns_422(client, auth_headers):
    response = _create_holding(client, auth_headers, ticker="")
    assert response.status_code == 422


def test_update_holding_negative_quantity_returns_422(client, auth_headers):
    holding_id = _create_holding(client, auth_headers).json()["id"]

    response = client.patch(
        f"/api/v1/holdings/{holding_id}",
        json={"quantity_added": "-1"},
        headers=auth_headers,
    )
    assert response.status_code == 422


# --- 404s for missing/foreign IDs (IDOR) ------------------------------------------


def test_get_missing_holding_returns_404(client, auth_headers):
    response = client.get("/api/v1/holdings/999999", headers=auth_headers)
    assert response.status_code == 404


def test_update_missing_holding_returns_404(client, auth_headers):
    response = client.patch(
        "/api/v1/holdings/999999",
        json={"quantity_added": "1"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_delete_missing_holding_returns_404(client, auth_headers):
    response = client.delete("/api/v1/holdings/999999", headers=auth_headers)
    assert response.status_code == 404


def test_other_users_holding_is_404_not_leaked(client, auth_headers, other_auth_headers):
    holding_id = _create_holding(client, auth_headers).json()["id"]

    get_response = client.get(f"/api/v1/holdings/{holding_id}", headers=other_auth_headers)
    assert get_response.status_code == 404

    update_response = client.patch(
        f"/api/v1/holdings/{holding_id}",
        json={"quantity_added": "1"},
        headers=other_auth_headers,
    )
    assert update_response.status_code == 404

    delete_response = client.delete(
        f"/api/v1/holdings/{holding_id}", headers=other_auth_headers
    )
    assert delete_response.status_code == 404

    # None of the above touched the real owner's holding.
    still_there = client.get(f"/api/v1/holdings/{holding_id}", headers=auth_headers)
    assert still_there.status_code == 200
    assert Decimal(still_there.json()["quantity_added"]) == Decimal("10")


# --- /performance and /summary aggregation ----------------------------------------


def test_performance_aggregates_gain_and_loss_across_holdings(
    client, auth_headers, monkeypatch
):
    _create_holding(
        client, auth_headers, ticker="AAPL", quantity_added="10", purchase_price="100"
    )
    _create_holding(
        client, auth_headers, ticker="MSFT", quantity_added="5", purchase_price="200"
    )

    prices = {"AAPL": Decimal("150"), "MSFT": Decimal("180")}
    monkeypatch.setattr(
        "app.routes.holdings.get_latest_price", lambda ticker: prices[ticker]
    )

    response = client.get("/api/v1/holdings/performance", headers=auth_headers)
    assert response.status_code == 200
    by_ticker = {row["ticker"]: row for row in response.json()}

    aapl = by_ticker["AAPL"]
    assert Decimal(aapl["cost_basis"]) == Decimal("1000")
    assert Decimal(aapl["market_value"]) == Decimal("1500")
    assert Decimal(aapl["gain_loss"]) == Decimal("500")
    assert Decimal(aapl["gain_loss_percentage"]) == Decimal("50")

    msft = by_ticker["MSFT"]
    assert Decimal(msft["cost_basis"]) == Decimal("1000")
    assert Decimal(msft["market_value"]) == Decimal("900")
    assert Decimal(msft["gain_loss"]) == Decimal("-100")
    assert Decimal(msft["gain_loss_percentage"]) == Decimal("-10")


def test_summary_aggregates_totals_across_holdings(client, auth_headers, monkeypatch):
    _create_holding(
        client, auth_headers, ticker="AAPL", quantity_added="10", purchase_price="100"
    )
    _create_holding(
        client, auth_headers, ticker="MSFT", quantity_added="5", purchase_price="200"
    )

    prices = {"AAPL": Decimal("150"), "MSFT": Decimal("180")}
    monkeypatch.setattr(
        "app.routes.holdings.get_latest_price", lambda ticker: prices[ticker]
    )

    response = client.get("/api/v1/holdings/summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()

    assert Decimal(body["total_cost_basis"]) == Decimal("2000")
    assert Decimal(body["total_market_value"]) == Decimal("2400")
    assert Decimal(body["total_gain_loss"]) == Decimal("400")
    assert Decimal(body["portfolio_return_percentage"]) == Decimal("20")


def test_summary_returns_zero_totals_when_no_holdings(client, auth_headers):
    response = client.get("/api/v1/holdings/summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()

    assert Decimal(body["total_cost_basis"]) == Decimal("0")
    assert Decimal(body["total_market_value"]) == Decimal("0")
    assert Decimal(body["total_gain_loss"]) == Decimal("0")
    assert Decimal(body["portfolio_return_percentage"]) == Decimal("0")


def test_performance_returns_503_when_price_is_unavailable(
    client, auth_headers, monkeypatch
):
    _create_holding(client, auth_headers, ticker="AAPL")

    def _raise(ticker):
        raise MarketDataError(f"no price for {ticker}")

    monkeypatch.setattr("app.routes.holdings.get_latest_price", _raise)

    response = client.get("/api/v1/holdings/performance", headers=auth_headers)
    assert response.status_code == 503
