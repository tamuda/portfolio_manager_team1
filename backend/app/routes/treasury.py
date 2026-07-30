from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import account_repository, treasury_repository
from app.schemas.treasury import (
    TreasuryBuyRequest,
    TreasurySellRequest,
    TreasuryHoldingResponse,
    TreasuryValuationResponse,
)
from app.services.bond_pricing_service import BondPricingError, price_treasury
from app.services.fred_client import FredApiError, get_yield_curve
from app.services.treasury_trading_service import (
    InsufficientFundsError,
    execute_treasury_buy,
    execute_treasury_sell,
)

router = APIRouter(
    prefix="/treasury",
    tags=["treasury"],
)


def _valuation(holding) -> TreasuryValuationResponse:
    try:
        yield_curve = get_yield_curve()
        market_value = price_treasury(
            face_value=holding.face_value,
            coupon_rate=holding.coupon_rate,
            coupon_frequency=holding.coupon_frequency,
            maturity_date=holding.maturity_date,
            yield_curve=yield_curve,
        )
    except (FredApiError, BondPricingError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not value this Treasury holding: {exc}",
        ) from exc

    current_price = market_value / holding.face_value * 100
    cost_basis = holding.face_value / 100 * holding.purchase_price
    gain_loss = market_value - cost_basis
    gain_loss_percentage = (gain_loss / cost_basis * 100) if cost_basis else 0

    return TreasuryValuationResponse(
        **TreasuryHoldingResponse.model_validate(holding).model_dump(),
        current_price=current_price,
        cost_basis=cost_basis,
        market_value=market_value,
        gain_loss=gain_loss,
        gain_loss_percentage=gain_loss_percentage,
    )


@router.get("", response_model=list[TreasuryHoldingResponse])
def get_treasury_holdings(db: Session = Depends(get_db)) -> list[TreasuryHoldingResponse]:
    account = account_repository.get_account(db)
    return treasury_repository.get_treasury_holdings(db, account.id)


@router.get("/{holding_id}", response_model=TreasuryHoldingResponse)
def get_treasury_holding(holding_id: int, db: Session = Depends(get_db)) -> TreasuryHoldingResponse:
    holding = treasury_repository.get_treasury_holding(db, holding_id)
    if holding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treasury holding {holding_id} was not found",
        )
    return holding


@router.get("/{holding_id}/valuation", response_model=TreasuryValuationResponse)
def get_treasury_valuation(holding_id: int, db: Session = Depends(get_db)) -> TreasuryValuationResponse:
    holding = treasury_repository.get_treasury_holding(db, holding_id)
    if holding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treasury holding {holding_id} was not found",
        )
    return _valuation(holding)


@router.post("/buy", response_model=TreasuryHoldingResponse)
def buy(request: TreasuryBuyRequest, db: Session = Depends(get_db)) -> TreasuryHoldingResponse:
    try:
        return execute_treasury_buy(db, request)
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/{holding_id}/sell")
def sell(holding_id: int, request: TreasurySellRequest, db: Session = Depends(get_db)) -> None:
    transaction = execute_treasury_sell(db, holding_id, request)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treasury holding {holding_id} was not found",
        )
