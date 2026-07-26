from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import transaction_repository
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
def get_transactions(db: Session = Depends(get_db)) -> list[TransactionResponse]:
    return transaction_repository.get_transactions(db)


@router.post("/buy", response_model=TransactionResponse)
def buy(request: BuyRequest, db: Session = Depends(get_db)) -> TransactionResponse:
    try:
        return execute_buy(db, request)
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/sell", response_model=TransactionResponse)
def sell(request: SellRequest, db: Session = Depends(get_db)) -> TransactionResponse:
    try:
        return execute_sell(db, request)
    except InsufficientSharesError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/transfer", response_model=TransactionResponse)
def transfer(request: TransferRequest, db: Session = Depends(get_db)) -> TransactionResponse:
    try:
        return execute_transfer(db, request)
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
