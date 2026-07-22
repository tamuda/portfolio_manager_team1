
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.exc import DataError, IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import holding_repository
from app.schemas.holding import (
    HoldingCreate,
    HoldingResponse,
    HoldingUpdate,
)

router = APIRouter(
    prefix="/holdings",
    tags=["holdings"],
)


@router.get("", response_model=list[HoldingResponse])
def get_holdings(db: Session = Depends(get_db)) -> list[HoldingResponse]:
    return holding_repository.get_holdings(db)

@router.post("", response_model=HoldingResponse)
def create_holding(request: HoldingCreate, db: Session = Depends(get_db)) -> HoldingResponse:
    try:
        return holding_repository.create_holding(db, request)
    except (DataError, IntegrityError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Holding data violates a database constraint",
        ) from exc

@router.get("/{holding_id}", response_model=HoldingResponse)
def get_holding(holding_id: int, db: Session = Depends(get_db)) -> HoldingResponse:
    holding = holding_repository.get_holding(db, holding_id)
    if holding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} was not found",
        )
    return holding

@router.patch("/{holding_id}", response_model=HoldingResponse)
def update_holding(holding_id: int, request: HoldingUpdate, db: Session = Depends(get_db)) -> HoldingResponse:
    try:
        holding = holding_repository.update_holding(db, holding_id, request)
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
def delete_holding(holding_id: int, db: Session = Depends(get_db)) -> None:
    if not holding_repository.delete_holding(db, holding_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} was not found",
        )



