from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.database.models import User
from app.repositories import account_repository, transaction_repository
from app.schemas.transaction import (
    BuyRequest,
    SellRequest,
    TransactionResponse,
    TransferRequest,
)
from app.services.trading_service import (
    InsufficientFundsError,
    InsufficientSharesError,
    execute_buy,
    execute_sell,
    execute_transfer,
)

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
)


@router.get("", response_model=list[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TransactionResponse]:
    account = account_repository.get_account(db, current_user)
    return transaction_repository.get_transactions(db, account.id)


@router.post("/buy", response_model=TransactionResponse)
def buy(
    request: BuyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionResponse:
    try:
        return execute_buy(db, current_user, request)
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/sell", response_model=TransactionResponse)
def sell(
    request: SellRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionResponse:
    try:
        return execute_sell(db, current_user, request)
    except InsufficientSharesError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/transfer", response_model=TransactionResponse)
def transfer(
    request: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionResponse:
    try:
        return execute_transfer(db, current_user, request)
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
