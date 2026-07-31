"""Combined portfolio summary across asset classes."""

from decimal import Decimal

from pydantic import BaseModel


class AssetClassSummary(BaseModel):
    count: int
    total_cost_basis: Decimal
    total_market_value: Decimal
    total_gain_loss: Decimal
    portfolio_return_percentage: Decimal


class CombinedPortfolioSummaryResponse(BaseModel):
    cash_balance: Decimal
    stocks: AssetClassSummary
    treasuries: AssetClassSummary
    total_cost_basis: Decimal
    total_market_value: Decimal
    total_gain_loss: Decimal
    portfolio_return_percentage: Decimal
