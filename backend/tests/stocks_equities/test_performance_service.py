"""Unit tests for app.services.performance_service — no client/DB involved."""

from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.services.performance_service import (
    calculate_holding_performance,
    calculate_portfolio_summary,
)


# --- calculate_holding_performance -------------------------------------------------


def test_calculate_holding_performance_gain():
    result = calculate_holding_performance(
        quantity=Decimal("10"),
        purchase_price=Decimal("100"),
        current_price=Decimal("150"),
    )
    assert result["cost_basis"] == Decimal("1000")
    assert result["market_value"] == Decimal("1500")
    assert result["gain_loss"] == Decimal("500")
    assert result["gain_loss_percentage"] == Decimal("50")


def test_calculate_holding_performance_loss():
    result = calculate_holding_performance(
        quantity=Decimal("5"),
        purchase_price=Decimal("200"),
        current_price=Decimal("180"),
    )
    assert result["cost_basis"] == Decimal("1000")
    assert result["market_value"] == Decimal("900")
    assert result["gain_loss"] == Decimal("-100")
    assert result["gain_loss_percentage"] == Decimal("-10")


def test_calculate_holding_performance_zero_cost_basis_returns_zero_percentage_not_divide_by_zero():
    # purchase_price of 0 makes cost_basis 0; must return 0%, not raise.
    result = calculate_holding_performance(
        quantity=Decimal("10"),
        purchase_price=Decimal("0"),
        current_price=Decimal("50"),
    )
    assert result["cost_basis"] == Decimal("0")
    assert result["gain_loss_percentage"] == Decimal("0")

    # quantity of 0 also makes cost_basis (and market_value) 0.
    result_zero_qty = calculate_holding_performance(
        quantity=Decimal("0"),
        purchase_price=Decimal("100"),
        current_price=Decimal("50"),
    )
    assert result_zero_qty["cost_basis"] == Decimal("0")
    assert result_zero_qty["market_value"] == Decimal("0")
    assert result_zero_qty["gain_loss_percentage"] == Decimal("0")


@pytest.mark.parametrize(
    "kwargs",
    [
        {"quantity": Decimal("-1"), "purchase_price": Decimal("100"), "current_price": Decimal("100")},
        {"quantity": Decimal("10"), "purchase_price": Decimal("-1"), "current_price": Decimal("100")},
        {"quantity": Decimal("10"), "purchase_price": Decimal("100"), "current_price": Decimal("-1")},
    ],
)
def test_calculate_holding_performance_negative_inputs_raise_value_error(kwargs):
    with pytest.raises(ValueError):
        calculate_holding_performance(**kwargs)


# --- calculate_portfolio_summary ---------------------------------------------------


def _holding(cost_basis: str, market_value: str):
    return SimpleNamespace(cost_basis=Decimal(cost_basis), market_value=Decimal(market_value))


def test_calculate_portfolio_summary_empty_list_returns_zero_totals():
    summary = calculate_portfolio_summary([])

    assert summary["total_cost_basis"] == Decimal("0")
    assert summary["total_market_value"] == Decimal("0")
    assert summary["total_gain_loss"] == Decimal("0")
    assert summary["portfolio_return_percentage"] == Decimal("0")


def test_calculate_portfolio_summary_zero_total_cost_basis_returns_zero_percentage_not_divide_by_zero():
    # Cost basis of 0 across the board (e.g. every holding had a 0 purchase
    # price) must not raise a ZeroDivisionError.
    holdings = [_holding("0", "0"), _holding("0", "500")]

    summary = calculate_portfolio_summary(holdings)

    assert summary["total_cost_basis"] == Decimal("0")
    assert summary["total_market_value"] == Decimal("500")
    assert summary["total_gain_loss"] == Decimal("500")
    assert summary["portfolio_return_percentage"] == Decimal("0")


def test_calculate_portfolio_summary_aggregates_multiple_holdings():
    holdings = [
        _holding("1000", "1500"),  # +500
        _holding("1000", "900"),  # -100
    ]

    summary = calculate_portfolio_summary(holdings)

    assert summary["total_cost_basis"] == Decimal("2000")
    assert summary["total_market_value"] == Decimal("2400")
    assert summary["total_gain_loss"] == Decimal("400")
    assert summary["portfolio_return_percentage"] == Decimal("20")
