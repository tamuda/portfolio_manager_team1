"""routes/portfolio.py — combined summary totals and cost-basis fallback."""

from decimal import Decimal
from types import SimpleNamespace

from fastapi import HTTPException, status

from app.routes import portfolio as portfolio_routes


def _seed_stock_and_treasury(client, headers):
    stock = client.post(
        "/api/v1/holdings",
        json={
            "ticker": "AAPL",
            "quantity_added": "10",
            "purchase_price": "150.00",
            "purchase_date": "2026-01-15",
        },
        headers=headers,
    )
    assert stock.status_code == 200

    deposit = client.post(
        "/api/v1/transactions/transfer",
        json={"direction": "DEPOSIT", "amount": "10000"},
        headers=headers,
    )
    assert deposit.status_code == 200

    treasury = client.post(
        "/api/v1/treasury/buy",
        json={
            "treasury_type": "BILL",
            "face_value": "1000",
            "coupon_rate": "0",
            "coupon_frequency": 0,
            "maturity_date": "2026-10-01",
            "purchase_price": "98.50",
            "purchase_date": "2026-04-01",
        },
        headers=headers,
    )
    assert treasury.status_code == 200

    # stock cost 1500, treasury cost 985
    return Decimal("1500"), Decimal("985")


def test_summary_falls_back_to_cost_basis_when_live_pricing_raises(
    client, auth_headers, monkeypatch
):
    stock_cost, treasury_cost = _seed_stock_and_treasury(client, auth_headers)

    def boom_stocks(*_args, **_kwargs):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="equity prices down",
        )

    def boom_treasuries(*_args, **_kwargs):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FRED unavailable",
        )

    monkeypatch.setattr(portfolio_routes, "_get_holdings_performance", boom_stocks)
    monkeypatch.setattr(portfolio_routes, "_get_treasury_performance", boom_treasuries)

    response = client.get("/api/v1/portfolio/summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()

    assert body["stocks"]["count"] == 1
    assert Decimal(body["stocks"]["total_cost_basis"]) == stock_cost
    assert Decimal(body["stocks"]["total_market_value"]) == stock_cost
    assert Decimal(body["stocks"]["total_gain_loss"]) == Decimal("0")

    assert body["treasuries"]["count"] == 1
    assert Decimal(body["treasuries"]["total_cost_basis"]) == treasury_cost
    assert Decimal(body["treasuries"]["total_market_value"]) == treasury_cost
    assert Decimal(body["treasuries"]["total_gain_loss"]) == Decimal("0")

    total_cost = stock_cost + treasury_cost
    assert Decimal(body["total_cost_basis"]) == total_cost
    assert Decimal(body["total_market_value"]) == total_cost
    assert Decimal(body["total_gain_loss"]) == Decimal("0")
    # cash: 10000 - 985
    assert Decimal(body["cash_balance"]) == Decimal("9015")


def test_summary_totals_across_stocks_and_treasuries(
    client, auth_headers, monkeypatch
):
    stock_cost, treasury_cost = _seed_stock_and_treasury(client, auth_headers)

    stock_market = Decimal("1800")  # +300
    treasury_market = Decimal("990")  # +5

    monkeypatch.setattr(
        portfolio_routes,
        "_get_holdings_performance",
        lambda *_a, **_k: [
            SimpleNamespace(cost_basis=stock_cost, market_value=stock_market)
        ],
    )
    monkeypatch.setattr(
        portfolio_routes,
        "_get_treasury_performance",
        lambda *_a, **_k: [
            SimpleNamespace(cost_basis=treasury_cost, market_value=treasury_market)
        ],
    )

    response = client.get("/api/v1/portfolio/summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()

    assert Decimal(body["stocks"]["total_cost_basis"]) == stock_cost
    assert Decimal(body["stocks"]["total_market_value"]) == stock_market
    assert Decimal(body["stocks"]["total_gain_loss"]) == stock_market - stock_cost

    assert Decimal(body["treasuries"]["total_cost_basis"]) == treasury_cost
    assert Decimal(body["treasuries"]["total_market_value"]) == treasury_market
    assert (
        Decimal(body["treasuries"]["total_gain_loss"])
        == treasury_market - treasury_cost
    )

    total_cost = stock_cost + treasury_cost
    total_market = stock_market + treasury_market
    assert Decimal(body["total_cost_basis"]) == total_cost
    assert Decimal(body["total_market_value"]) == total_market
    assert Decimal(body["total_gain_loss"]) == total_market - total_cost
    expected_return = (total_market - total_cost) / total_cost * Decimal("100")
    assert Decimal(body["portfolio_return_percentage"]) == expected_return
