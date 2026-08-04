"""trading_service.execute_buy/sell/transfer, exercised through /transactions/*.

Covers: insufficient funds/shares raising as 422, FIFO lot consumption on a
partial sell, a sell spanning multiple lots, a sell that exactly exhausts a
lot (deleted vs. partially reduced), and deposit/withdrawal cash math.
"""

from decimal import Decimal


def _deposit(client, headers, amount: str):
    response = client.post(
        "/api/v1/transactions/transfer",
        json={"direction": "DEPOSIT", "amount": amount},
        headers=headers,
    )
    assert response.status_code == 200
    return response.json()


def _buy(client, headers, ticker: str, quantity: str, price: str, trade_date: str):
    return client.post(
        "/api/v1/transactions/buy",
        json={
            "ticker": ticker,
            "quantity": quantity,
            "price": price,
            "trade_date": trade_date,
        },
        headers=headers,
    )


def _cash_balance(client, headers) -> Decimal:
    return Decimal(client.get("/api/v1/account", headers=headers).json()["cash_balance"])


def _holdings_for(client, headers, ticker: str) -> list[dict]:
    holdings = client.get("/api/v1/holdings", headers=headers).json()
    return [h for h in holdings if h["ticker"] == ticker]


# --- insufficient funds / shares -------------------------------------------------


def test_buy_with_insufficient_funds_raises_422(client, auth_headers):
    response = _buy(client, auth_headers, "AAPL", "1", "100", "2026-01-01")
    assert response.status_code == 422
    assert "exceeds" in response.json()["detail"]

    assert _holdings_for(client, auth_headers, "AAPL") == []


def test_sell_with_no_shares_held_raises_422(client, auth_headers):
    response = client.post(
        "/api/v1/transactions/sell",
        json={"ticker": "TSLA", "quantity": "1", "price": "100"},
        headers=auth_headers,
    )
    assert response.status_code == 422
    assert "only" in response.json()["detail"]


def test_sell_more_than_held_raises_422(client, auth_headers):
    _deposit(client, auth_headers, "10000")
    _buy(client, auth_headers, "NVDA", "5", "100", "2026-01-01")

    response = client.post(
        "/api/v1/transactions/sell",
        json={"ticker": "NVDA", "quantity": "6", "price": "100"},
        headers=auth_headers,
    )
    assert response.status_code == 422

    # The failed sell must not have touched the existing lot.
    lots = _holdings_for(client, auth_headers, "NVDA")
    assert len(lots) == 1
    assert Decimal(lots[0]["quantity_added"]) == Decimal("5")


def test_withdrawal_with_insufficient_funds_raises_422(client, auth_headers):
    _deposit(client, auth_headers, "100")

    response = client.post(
        "/api/v1/transactions/transfer",
        json={"direction": "WITHDRAWAL", "amount": "200"},
        headers=auth_headers,
    )
    assert response.status_code == 422
    assert _cash_balance(client, auth_headers) == Decimal("100")


# --- deposit / withdrawal cash math -----------------------------------------------


def test_deposit_increases_cash_balance(client, auth_headers):
    response = _deposit(client, auth_headers, "500")

    assert response["type"] == "TRANSFER_IN"
    assert Decimal(response["amount"]) == Decimal("500")
    assert Decimal(response["cash_balance_after"]) == Decimal("500")
    assert _cash_balance(client, auth_headers) == Decimal("500")


def test_withdrawal_decreases_cash_balance(client, auth_headers):
    _deposit(client, auth_headers, "1000")

    response = client.post(
        "/api/v1/transactions/transfer",
        json={"direction": "WITHDRAWAL", "amount": "300"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "TRANSFER_OUT"
    assert Decimal(body["amount"]) == Decimal("300")
    assert Decimal(body["cash_balance_after"]) == Decimal("700")
    assert _cash_balance(client, auth_headers) == Decimal("700")


# --- FIFO lot consumption on sell -------------------------------------------------


def test_buy_debits_cash_and_creates_a_lot(client, auth_headers):
    _deposit(client, auth_headers, "10000")

    response = _buy(client, auth_headers, "MSFT", "10", "50", "2026-01-01")
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "BUY"
    assert Decimal(body["amount"]) == Decimal("500")
    assert Decimal(body["cash_balance_after"]) == Decimal("9500")

    lots = _holdings_for(client, auth_headers, "MSFT")
    assert len(lots) == 1
    assert Decimal(lots[0]["quantity_added"]) == Decimal("10")
    assert Decimal(lots[0]["purchase_price"]) == Decimal("50")


def test_partial_sell_reduces_lot_without_deleting_it(client, auth_headers):
    _deposit(client, auth_headers, "10000")
    _buy(client, auth_headers, "MSFT", "10", "50", "2026-01-01")  # cost basis 500

    response = client.post(
        "/api/v1/transactions/sell",
        json={"ticker": "MSFT", "quantity": "4", "price": "60"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert Decimal(body["amount"]) == Decimal("240")  # 4 * 60 proceeds
    assert Decimal(body["realized_gain_loss"]) == Decimal("40")  # 240 - (4*50)

    lots = _holdings_for(client, auth_headers, "MSFT")
    assert len(lots) == 1
    assert Decimal(lots[0]["quantity_added"]) == Decimal("6")
    assert Decimal(lots[0]["purchase_price"]) == Decimal("50")  # lot untouched otherwise


def test_sell_exactly_exhausting_a_lot_deletes_it(client, auth_headers):
    _deposit(client, auth_headers, "5000")
    _buy(client, auth_headers, "GOOG", "5", "100", "2026-01-01")  # cost basis 500

    response = client.post(
        "/api/v1/transactions/sell",
        json={"ticker": "GOOG", "quantity": "5", "price": "120"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert Decimal(body["amount"]) == Decimal("600")  # 5 * 120
    assert Decimal(body["realized_gain_loss"]) == Decimal("100")  # 600 - 500

    assert _holdings_for(client, auth_headers, "GOOG") == []


def test_sell_spanning_multiple_lots_consumes_oldest_first(client, auth_headers):
    _deposit(client, auth_headers, "10000")
    _buy(client, auth_headers, "AAPL", "10", "100", "2026-01-01")  # older lot, cost 1000
    _buy(client, auth_headers, "AAPL", "10", "150", "2026-02-01")  # newer lot, cost 1500

    response = client.post(
        "/api/v1/transactions/sell",
        json={"ticker": "AAPL", "quantity": "15", "price": "200"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()

    proceeds = Decimal("15") * Decimal("200")
    cost_basis_sold = (Decimal("10") * Decimal("100")) + (Decimal("5") * Decimal("150"))
    assert Decimal(body["amount"]) == proceeds
    assert Decimal(body["realized_gain_loss"]) == proceeds - cost_basis_sold

    # The older lot (10 @ 100) is fully consumed and gone; the newer lot
    # (10 @ 150) is only partially consumed, leaving 5 shares behind.
    lots = _holdings_for(client, auth_headers, "AAPL")
    assert len(lots) == 1
    assert Decimal(lots[0]["quantity_added"]) == Decimal("5")
    assert Decimal(lots[0]["purchase_price"]) == Decimal("150")

    expected_cash = Decimal("10000") - Decimal("1000") - Decimal("1500") + proceeds
    assert _cash_balance(client, auth_headers) == expected_cash
