"""Data access layer for the holdings table."""

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.models import Holding, User
from app.schemas.holding import HoldingCreate, HoldingUpdate


def get_holdings(db: Session, user: User) -> list[Holding]:
    return db.query(Holding).filter(Holding.user_id == user.id).all()


def get_holding(db: Session, user: User, holding_id: int) -> Holding | None:
    return (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == user.id)
        .first()
    )


def get_holdings_by_ticker(db: Session, user: User, ticker: str) -> list[Holding]:
    """Return every lot of a ticker the user holds, oldest purchase first (for FIFO disposal on sell)."""

    return (
        db.query(Holding)
        .filter(Holding.user_id == user.id, Holding.ticker == ticker)
        .order_by(Holding.purchase_date.asc(), Holding.id.asc())
        .all()
    )


def create_holding(db: Session, user: User, data: HoldingCreate) -> Holding:
    holding = Holding(
        user_id=user.id,
        ticker=data.ticker,
        quantity_added=data.quantity_added,
        purchase_price=data.purchase_price,
        purchase_date=data.purchase_date,
    )
    db.add(holding)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(holding)
    return holding


def update_holding(
    db: Session, user: User, holding_id: int, data: HoldingUpdate
) -> Holding | None:
    holding = get_holding(db, user, holding_id)
    if holding is None:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(holding, field, value)

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(holding)
    return holding


def delete_holding(db: Session, user: User, holding_id: int) -> bool:
    holding = get_holding(db, user, holding_id)
    if holding is None:
        return False

    db.delete(holding)
    db.commit()
    return True
