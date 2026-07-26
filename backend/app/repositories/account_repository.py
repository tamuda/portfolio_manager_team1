"""Data access layer for the single implicit brokerage account."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.database.models import Account


def get_account(db: Session) -> Account:
    """Return the account, creating it with a zero balance if it's missing."""

    account = db.query(Account).first()
    if account is None:
        account = Account(cash_balance=Decimal("0"))
        db.add(account)
        db.commit()
        db.refresh(account)
    return account
