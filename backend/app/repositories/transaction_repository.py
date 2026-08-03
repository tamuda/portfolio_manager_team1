"""Data access layer for the transactions table (the account activity ledger)."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.database.models import Transaction, TransactionType


def get_transactions(db: Session, account_id: int) -> list[Transaction]:
    return (
        db.query(Transaction)
        .filter(Transaction.account_id == account_id)
        .order_by(Transaction.executed_at.desc(), Transaction.id.desc())
        .all()
    )


def build_transaction(
    account_id: int,
    type: TransactionType,
    amount: Decimal,
    cash_balance_after: Decimal,
    ticker: str | None = None,
    quantity: Decimal | None = None,
    price: Decimal | None = None,
    realized_gain_loss: Decimal | None = None,
) -> Transaction:
    """Build (but don't persist) a Transaction row for the caller to add to the session."""

    return Transaction(
        account_id=account_id,
        type=type,
        ticker=ticker,
        quantity=quantity,
        price=price,
        amount=amount,
        realized_gain_loss=realized_gain_loss,
        cash_balance_after=cash_balance_after,
    )
