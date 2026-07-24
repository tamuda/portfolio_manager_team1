from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import DataError, IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import watchlist_repository
from app.schemas.watchlist import (
    WatchlistItemCreate,
    WatchlistItemResponse,
    WatchlistReorderRequest,
)

router = APIRouter(
    prefix="/watchlist",
    tags=["watchlist"],
)


@router.get("", response_model=list[WatchlistItemResponse])
def get_watchlist(db: Session = Depends(get_db)) -> list[WatchlistItemResponse]:
    return watchlist_repository.get_watchlist(db)


@router.post("", response_model=WatchlistItemResponse)
def create_watchlist_item(
    request: WatchlistItemCreate, db: Session = Depends(get_db)
) -> WatchlistItemResponse:
    if watchlist_repository.get_watchlist_item_by_ticker(db, request.ticker):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{request.ticker} is already on your watchlist.",
        )

    try:
        return watchlist_repository.create_watchlist_item(db, request)
    except (DataError, IntegrityError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Watchlist item data violates a database constraint",
        ) from exc


@router.put("/reorder", response_model=list[WatchlistItemResponse])
def reorder_watchlist(
    request: WatchlistReorderRequest, db: Session = Depends(get_db)
) -> list[WatchlistItemResponse]:
    return watchlist_repository.reorder_watchlist(db, request.ordered_ids)


@router.delete("/{item_id}")
def delete_watchlist_item(item_id: int, db: Session = Depends(get_db)) -> None:
    if not watchlist_repository.delete_watchlist_item(db, item_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist item {item_id} was not found",
        )
