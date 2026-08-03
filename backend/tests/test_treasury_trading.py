"""Treasury routes + treasury_trading_service — buy/sell math and IDOR."""

from decimal import Decimal


def _deposit(client, headers, amount: str = "10000"):
    response = client.post(
        "/api/v1/transactions/transfer",
        json={"direction": "DEPOSIT", "amount": amount},
        headers=headers,
    )
    assert response.status_code == 200
    return response


def _buy_bill(
    client,
    headers,
    *,
    face_value: str = "1000",
    purchase_price: str = "98.50",
    maturity_date: str = "2026-10-01",
):
    return client.post(
        "/api/v1/treasury/buy",
        json={
            "treasury_type": "BILL",
            "face_value": face_value,
            "coupon_rate": "0",
            "coupon_frequency": 0,
            "maturity_date": maturity_date,
            "purchase_price": purchase_price,
            "purchase_date": "2026-04-01",
        },
        headers=headers,
    )


def test_buy_debits_cash_by_face_times_price_over_100(client, auth_headers):
    _deposit(client, auth_headers, "10000")

    # cost = 1000 / 100 * 98.50 = 985
    response = _buy_bill(client, auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["face_value"] == "1000.000000"
    assert body["purchase_price"] == "98.500000"

    account = client.get("/api/v1/account", headers=auth_headers).json()
    assert Decimal(account["cash_balance"]) == Decimal("10000") - Decimal("985")


def test_buy_insufficient_funds_returns_422(client, auth_headers):
    _deposit(client, auth_headers, "100")

    response = _buy_bill(client, auth_headers, face_value="1000", purchase_price="98.50")
    assert response.status_code == 422
    assert "exceeds the available cash balance" in response.json()["detail"]

    holdings = client.get("/api/v1/treasury", headers=auth_headers).json()
    assert holdings == []

    account = client.get("/api/v1/account", headers=auth_headers).json()
    assert Decimal(account["cash_balance"]) == Decimal("100")


def test_sell_credits_proceeds_and_reports_realized_gain(client, auth_headers):
    _deposit(client, auth_headers, "10000")
    buy = _buy_bill(client, auth_headers, purchase_price="98.50")
    holding_id = buy.json()["id"]

    # sell at 99.00 → proceeds = 990, cost = 985, gain = 5
    sell = client.post(
        f"/api/v1/treasury/{holding_id}/sell",
        json={"sale_price": "99.00"},
        headers=auth_headers,
    )
    assert sell.status_code == 200
    body = sell.json()
    assert Decimal(body["proceeds"]) == Decimal("990")
    assert Decimal(body["cost_basis"]) == Decimal("985")
    assert Decimal(body["realized_gain_loss"]) == Decimal("5")
    assert Decimal(body["cash_balance_after"]) == Decimal("10000") - Decimal("985") + Decimal(
        "990"
    )

    leftover = client.get("/api/v1/treasury", headers=auth_headers).json()
    assert leftover == []


def test_sell_nonexistent_holding_returns_404(client, auth_headers):
    response = client.post(
        "/api/v1/treasury/99999/sell",
        json={"sale_price": "100.00"},
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "was not found" in response.json()["detail"]


def test_sell_foreign_holding_returns_404_idor(
    client, auth_headers, other_auth_headers
):
    _deposit(client, auth_headers, "10000")
    buy = _buy_bill(client, auth_headers)
    holding_id = buy.json()["id"]

    # Other user must not sell (or even see) this lot.
    foreign_sell = client.post(
        f"/api/v1/treasury/{holding_id}/sell",
        json={"sale_price": "100.00"},
        headers=other_auth_headers,
    )
    assert foreign_sell.status_code == 404

    still_owned = client.get(f"/api/v1/treasury/{holding_id}", headers=auth_headers)
    assert still_owned.status_code == 200

    other_list = client.get("/api/v1/treasury", headers=other_auth_headers).json()
    assert other_list == []
