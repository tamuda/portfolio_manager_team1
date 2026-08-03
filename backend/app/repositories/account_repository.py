"""Data access layer for brokerage accounts."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.database.models import Account, User


def get_account(db: Session, user: User) -> Account:
    """Return the user's account, creating it with a zero balance if it's missing."""

    account = db.query(Account).filter(Account.user_id == user.id).first()
    if account is None:
        account = Account(user_id=user.id, cash_balance=Decimal("0"))
        db.add(account)
        db.commit()
        db.refresh(account)
    return account
