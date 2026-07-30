"""Data access layer for the treasury_holdings table."""

from sqlalchemy.orm import Session

from app.database.models import TreasuryHolding


def get_treasury_holdings(db: Session, account_id: int) -> list[TreasuryHolding]:
    return (
        db.query(TreasuryHolding)
        .filter(TreasuryHolding.account_id == account_id)
        .order_by(TreasuryHolding.maturity_date.asc(), TreasuryHolding.id.asc())
        .all()
    )


def get_treasury_holding(db: Session, holding_id: int) -> TreasuryHolding | None:
    return db.get(TreasuryHolding, holding_id)
