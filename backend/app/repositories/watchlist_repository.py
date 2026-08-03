"""Data access layer for the watchlist_items table."""

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.models import User, WatchlistItem
from app.schemas.watchlist import WatchlistItemCreate


def get_watchlist(db: Session, user: User) -> list[WatchlistItem]:
    return (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user.id)
        .order_by(WatchlistItem.position, WatchlistItem.id)
        .all()
    )


def get_watchlist_item(db: Session, user: User, item_id: int) -> WatchlistItem | None:
    return (
        db.query(WatchlistItem)
        .filter(WatchlistItem.id == item_id, WatchlistItem.user_id == user.id)
        .first()
    )


def get_watchlist_item_by_ticker(db: Session, user: User, ticker: str) -> WatchlistItem | None:
    return (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user.id, WatchlistItem.ticker == ticker)
        .first()
    )


def create_watchlist_item(db: Session, user: User, data: WatchlistItemCreate) -> WatchlistItem:
    last_position = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user.id)
        .order_by(WatchlistItem.position.desc())
        .first()
    )
    next_position = (last_position.position + 1) if last_position else 0

    item = WatchlistItem(user_id=user.id, ticker=data.ticker, position=next_position)
    db.add(item)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(item)
    return item


def delete_watchlist_item(db: Session, user: User, item_id: int) -> bool:
    item = get_watchlist_item(db, user, item_id)
    if item is None:
        return False

    db.delete(item)
    db.commit()
    return True


def reorder_watchlist(db: Session, user: User, ordered_ids: list[int]) -> list[WatchlistItem]:
    items_by_id = {item.id: item for item in get_watchlist(db, user)}

    for position, item_id in enumerate(ordered_ids):
        item = items_by_id.get(item_id)
        if item is not None:
            item.position = position

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

    return get_watchlist(db, user)
