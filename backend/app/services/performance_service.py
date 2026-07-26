from decimal import Decimal
from typing import Protocol, Sequence, TypedDict


class HoldingPerformance(TypedDict):
    current_price: Decimal
    cost_basis: Decimal
    market_value: Decimal
    gain_loss: Decimal
    gain_loss_percentage: Decimal


class PortfolioSummary(TypedDict):
    total_cost_basis: Decimal
    total_market_value: Decimal
    total_gain_loss: Decimal
    portfolio_return_percentage: Decimal


class HasCostAndMarketValue(Protocol):
    cost_basis: Decimal
    market_value: Decimal


def calculate_holding_performance(
    quantity: Decimal,
    purchase_price: Decimal,
    current_price: Decimal,
) -> HoldingPerformance:
    """
    Calculate the current financial performance of one holding.

    Args:
        quantity: Number of shares owned.
        purchase_price: Purchase price or average cost per share.
        current_price: Latest market price per share.

    Returns:
        A dictionary containing the holding's calculated performance.
    """

    if quantity < 0:
        raise ValueError("Quantity cannot be negative.")

    if purchase_price < 0:
        raise ValueError("Purchase price cannot be negative.")

    if current_price < 0:
        raise ValueError("Current price cannot be negative.")

    cost_basis = quantity * purchase_price
    market_value = quantity * current_price
    gain_loss = market_value - cost_basis

    if cost_basis == 0:
        gain_loss_percentage = Decimal("0")
    else:
        gain_loss_percentage = (
            gain_loss / cost_basis
        ) * Decimal("100")

    return {
        "current_price": current_price,
        "cost_basis": cost_basis,
        "market_value": market_value,
        "gain_loss": gain_loss,
        "gain_loss_percentage": gain_loss_percentage,
    }


def calculate_portfolio_summary(
    holdings: Sequence[HasCostAndMarketValue],
) -> PortfolioSummary:
    """
    Aggregate per-holding performance into portfolio-wide totals.

    Args:
        holdings: Holdings that already carry a cost_basis and market_value
            (e.g. the HoldingPerformanceResponse list from /holdings/performance).

    Returns:
        A dictionary containing the portfolio's aggregated performance.
    """

    total_cost_basis = sum((h.cost_basis for h in holdings), Decimal("0"))
    total_market_value = sum((h.market_value for h in holdings), Decimal("0"))
    total_gain_loss = total_market_value - total_cost_basis

    if total_cost_basis == 0:
        portfolio_return_percentage = Decimal("0")
    else:
        portfolio_return_percentage = (
            total_gain_loss / total_cost_basis
        ) * Decimal("100")

    return {
        "total_cost_basis": total_cost_basis,
        "total_market_value": total_market_value,
        "total_gain_loss": total_gain_loss,
        "portfolio_return_percentage": portfolio_return_percentage,
    }