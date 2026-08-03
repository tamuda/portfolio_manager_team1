from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.database.models import User
from app.repositories import account_repository, treasury_repository
from app.schemas.treasury import (
    TreasuryBuyRequest,
    TreasurySellRequest,
    TreasuryHoldingResponse,
    TreasurySellResponse,
    TreasuryValuationResponse,
    YieldCurvePoint,
    YieldCurveResponse,
)
from app.services.bond_pricing_service import BondPricingError, price_treasury
from app.services.fred_client import (
    FredApiError,
    get_yield_curve,
    get_yield_curve_as_of,
)
from app.services.treasury_trading_service import (
    InsufficientFundsError,
    execute_treasury_buy,
    execute_treasury_sell,
)

router = APIRouter(
    prefix="/treasury",
    tags=["treasury"],
)


def _valuation_with_curve(holding, yield_curve: dict[float, Decimal]) -> TreasuryValuationResponse:
    market_value = price_treasury(
        face_value=holding.face_value,
        coupon_rate=holding.coupon_rate,
        coupon_frequency=holding.coupon_frequency,
        maturity_date=holding.maturity_date,
        yield_curve=yield_curve,
    )

    current_price = market_value / holding.face_value * 100
    cost_basis = holding.face_value / 100 * holding.purchase_price
    gain_loss = market_value - cost_basis
    gain_loss_percentage = (gain_loss / cost_basis * 100) if cost_basis else Decimal("0")

    return TreasuryValuationResponse(
        **TreasuryHoldingResponse.model_validate(holding).model_dump(),
        current_price=current_price,
        cost_basis=cost_basis,
        market_value=market_value,
        gain_loss=gain_loss,
        gain_loss_percentage=gain_loss_percentage,
    )


def _valuation(holding) -> TreasuryValuationResponse:
    try:
        yield_curve = get_yield_curve()
        return _valuation_with_curve(holding, yield_curve)
    except (FredApiError, BondPricingError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not value this Treasury holding: {exc}",
        ) from exc


@router.get("", response_model=list[TreasuryHoldingResponse])
def get_treasury_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TreasuryHoldingResponse]:
    account = account_repository.get_account(db, current_user)
    return treasury_repository.get_treasury_holdings(db, account.id)


@router.get("/yield-curve", response_model=YieldCurveResponse)
def read_yield_curve() -> YieldCurveResponse:
    try:
        curve = get_yield_curve()
    except FredApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    points = [
        YieldCurvePoint(tenor_years=tenor, yield_percent=yield_pct)
        for tenor, yield_pct in sorted(curve.items(), key=lambda item: item[0])
    ]
    return YieldCurveResponse(as_of=get_yield_curve_as_of(), points=points)


def _get_treasury_performance(db: Session, user: User) -> list[TreasuryValuationResponse]:
    account = account_repository.get_account(db, user)
    holdings = treasury_repository.get_treasury_holdings(db, account.id)
    if not holdings:
        return []

    try:
        yield_curve = get_yield_curve()
    except FredApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    results: list[TreasuryValuationResponse] = []
    for holding in holdings:
        try:
            results.append(_valuation_with_curve(holding, yield_curve))
        except (BondPricingError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not value Treasury holding {holding.id}: {exc}",
            ) from exc

    return results


@router.get("/performance", response_model=list[TreasuryValuationResponse])
def get_treasury_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TreasuryValuationResponse]:
    return _get_treasury_performance(db, current_user)


@router.post("/buy", response_model=TreasuryHoldingResponse)
def buy(
    request: TreasuryBuyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TreasuryHoldingResponse:
    try:
        return execute_treasury_buy(db, current_user, request)
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get("/{holding_id}", response_model=TreasuryHoldingResponse)
def get_treasury_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TreasuryHoldingResponse:
    account = account_repository.get_account(db, current_user)
    holding = treasury_repository.get_treasury_holding(db, account.id, holding_id)
    if holding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treasury holding {holding_id} was not found",
        )
    return holding


@router.get("/{holding_id}/valuation", response_model=TreasuryValuationResponse)
def get_treasury_valuation(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TreasuryValuationResponse:
    account = account_repository.get_account(db, current_user)
    holding = treasury_repository.get_treasury_holding(db, account.id, holding_id)
    if holding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treasury holding {holding_id} was not found",
        )
    return _valuation(holding)


@router.post("/{holding_id}/sell", response_model=TreasurySellResponse)
def sell(
    holding_id: int,
    request: TreasurySellRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TreasurySellResponse:
    transaction = execute_treasury_sell(db, current_user, holding_id, request)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treasury holding {holding_id} was not found",
        )

    return TreasurySellResponse(
        holding_id=holding_id,
        ticker=transaction.ticker or "",
        proceeds=transaction.amount,
        cost_basis=transaction.amount - (transaction.realized_gain_loss or Decimal("0")),
        realized_gain_loss=transaction.realized_gain_loss or Decimal("0"),
        cash_balance_after=transaction.cash_balance_after,
    )
