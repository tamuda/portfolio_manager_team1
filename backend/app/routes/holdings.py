
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.exc import DataError, IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.database.models import User
from app.repositories import holding_repository
from app.schemas.holding import (
    HoldingCreate,
    HoldingResponse,
    HoldingUpdate,
    HoldingPerformanceResponse,
    PortfolioSummaryResponse,
)
from app.services.market_data_service import (
    MarketDataError,
    get_latest_price,
)
from app.services.performance_service import (
    calculate_holding_performance,
    calculate_portfolio_summary,
)

router = APIRouter(
    prefix="/holdings",
    tags=["holdings"],
)


@router.get("", response_model=list[HoldingResponse])
def get_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[HoldingResponse]:
    return holding_repository.get_holdings(db, current_user)

@router.post("", response_model=HoldingResponse)
def create_holding(
    request: HoldingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HoldingResponse:
    try:
        return holding_repository.create_holding(db, current_user, request)
    except (DataError, IntegrityError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Holding data violates a database constraint",
        ) from exc

def _get_holdings_performance(
    db: Session,
    user: User,
) -> list[HoldingPerformanceResponse]:
    holdings = holding_repository.get_holdings(db, user)

    results: list[HoldingPerformanceResponse] = []
    for holding in holdings:
        try:
            current_price = get_latest_price(holding.ticker)
        except MarketDataError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Could not retrieve the current price "
                    f"for {holding.ticker}."
                ),
            ) from exc

        performance = calculate_holding_performance(
            quantity=holding.quantity_added,
            purchase_price=holding.purchase_price,
            current_price=current_price,
        )

        response = HoldingPerformanceResponse(
            id=holding.id,
            ticker=holding.ticker,
            quantity_added=holding.quantity_added,
            purchase_price=holding.purchase_price,
            purchase_date=holding.purchase_date,
            current_price=performance["current_price"],
            cost_basis=performance["cost_basis"],
            market_value=performance["market_value"],
            gain_loss=performance["gain_loss"],
            gain_loss_percentage=performance[
                "gain_loss_percentage"
            ],
        )

        results.append(response)

    return results


@router.get(
    "/performance",
    response_model=list[HoldingPerformanceResponse],
)
def get_holdings_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[HoldingPerformanceResponse]:
    return _get_holdings_performance(db, current_user)


@router.get(
    "/summary",
    response_model=PortfolioSummaryResponse,
)
def get_portfolio_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PortfolioSummaryResponse:
    holdings_performance = _get_holdings_performance(db, current_user)
    summary = calculate_portfolio_summary(holdings_performance)
    return PortfolioSummaryResponse(**summary)

@router.get("/{holding_id}", response_model=HoldingResponse)
def get_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HoldingResponse:
    holding = holding_repository.get_holding(db, current_user, holding_id)
    if holding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} was not found",
        )
    return holding

@router.patch("/{holding_id}", response_model=HoldingResponse)
def update_holding(
    holding_id: int,
    request: HoldingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HoldingResponse:
    try:
        holding = holding_repository.update_holding(db, current_user, holding_id, request)
    except (DataError, IntegrityError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Holding data violates a database constraint",
        ) from exc
    if holding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} was not found",
        )
    return holding

@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if not holding_repository.delete_holding(db, current_user, holding_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} was not found",
        )



