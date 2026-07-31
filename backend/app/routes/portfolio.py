"""Combined portfolio summary across stocks and treasuries."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import account_repository, holding_repository, treasury_repository
from app.routes.holdings import _get_holdings_performance
from app.routes.treasury import _get_treasury_performance
from app.schemas.portfolio import AssetClassSummary, CombinedPortfolioSummaryResponse
from app.services.performance_service import calculate_portfolio_summary

router = APIRouter(
    prefix="/portfolio",
    tags=["portfolio"],
)


def _empty_class_summary() -> AssetClassSummary:
    return AssetClassSummary(
        count=0,
        total_cost_basis=Decimal("0"),
        total_market_value=Decimal("0"),
        total_gain_loss=Decimal("0"),
        portfolio_return_percentage=Decimal("0"),
    )


def _to_class_summary(holdings: list, count: int) -> AssetClassSummary:
    if not holdings:
        return _empty_class_summary()

    summary = calculate_portfolio_summary(holdings)
    return AssetClassSummary(
        count=count,
        total_cost_basis=summary["total_cost_basis"],
        total_market_value=summary["total_market_value"],
        total_gain_loss=summary["total_gain_loss"],
        portfolio_return_percentage=summary["portfolio_return_percentage"],
    )


class _CostOnlyHolding:
    """Minimal stand-in when live pricing is unavailable (market = cost)."""

    def __init__(self, cost_basis: Decimal):
        self.cost_basis = cost_basis
        self.market_value = cost_basis


def _treasury_cost_only_summary(db: Session, account_id: int) -> AssetClassSummary:
    lots = treasury_repository.get_treasury_holdings(db, account_id)
    if not lots:
        return _empty_class_summary()

    stand_ins = [
        _CostOnlyHolding(lot.face_value / Decimal("100") * lot.purchase_price)
        for lot in lots
    ]
    return _to_class_summary(stand_ins, len(lots))


@router.get("/summary", response_model=CombinedPortfolioSummaryResponse)
def get_combined_portfolio_summary(
    db: Session = Depends(get_db),
) -> CombinedPortfolioSummaryResponse:
    account = account_repository.get_account(db)

    stocks_summary = _empty_class_summary()
    treasuries_summary = _empty_class_summary()

    stock_lots = holding_repository.get_holdings(db)
    if stock_lots:
        try:
            stock_holdings = _get_holdings_performance(db)
            stocks_summary = _to_class_summary(stock_holdings, len(stock_holdings))
        except HTTPException:
            # Fall back to cost basis only when equity prices fail.
            stand_ins = [
                _CostOnlyHolding(lot.quantity_added * lot.purchase_price)
                for lot in stock_lots
            ]
            stocks_summary = _to_class_summary(stand_ins, len(stock_lots))

    treasury_lots = treasury_repository.get_treasury_holdings(db, account.id)
    if treasury_lots:
        try:
            treasury_holdings = _get_treasury_performance(db)
            treasuries_summary = _to_class_summary(
                treasury_holdings, len(treasury_holdings)
            )
        except HTTPException:
            treasuries_summary = _treasury_cost_only_summary(db, account.id)

    total_cost = stocks_summary.total_cost_basis + treasuries_summary.total_cost_basis
    total_market = (
        stocks_summary.total_market_value + treasuries_summary.total_market_value
    )
    total_gain = total_market - total_cost
    total_return = (total_gain / total_cost * 100) if total_cost else Decimal("0")

    return CombinedPortfolioSummaryResponse(
        cash_balance=account.cash_balance,
        stocks=stocks_summary,
        treasuries=treasuries_summary,
        total_cost_basis=total_cost,
        total_market_value=total_market,
        total_gain_loss=total_gain,
        portfolio_return_percentage=total_return,
    )
