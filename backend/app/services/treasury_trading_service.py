"""Business logic for buying and selling US Treasury holdings.

Mirrors trading_service.py: each operation mutates cash balance and appends
one row to the transactions ledger, all committed together so a failure
leaves no partial trade behind. Since a Treasury holding isn't a divisible
quantity like a share count, "sell" always closes the entire lot.
"""

from datetime import date
from decimal import Decimal

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.models import Transaction, TransactionType, TreasuryHolding, User
from app.repositories import account_repository, transaction_repository, treasury_repository
from app.schemas.treasury import TreasuryBuyRequest, TreasurySellRequest


class InsufficientFundsError(Exception):
    """Raised when buying a Treasury holding would overdraw the account's cash balance."""


def _label(holding: TreasuryHolding) -> str:
    """A synthetic identifier for the transactions ledger's ticker column."""

    return f"UST-{holding.treasury_type.value}-{holding.maturity_date.isoformat()}"


def _commit(db: Session, transaction: Transaction) -> Transaction:
    db.add(transaction)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(transaction)
    return transaction


def execute_treasury_buy(db: Session, user: User, request: TreasuryBuyRequest) -> TreasuryHolding:
    total_cost = request.face_value / Decimal("100") * request.purchase_price

    account = account_repository.get_account(db, user)
    if total_cost > account.cash_balance:
        raise InsufficientFundsError(
            f"Buying {request.face_value} face value of this Treasury "
            f"{request.treasury_type.value.lower()} at {request.purchase_price} "
            f"costs {total_cost}, which exceeds the available cash balance of "
            f"{account.cash_balance}."
        )

    holding = TreasuryHolding(
        account_id=account.id,
        treasury_type=request.treasury_type,
        face_value=request.face_value,
        coupon_rate=request.coupon_rate,
        coupon_frequency=request.coupon_frequency,
        maturity_date=request.maturity_date,
        purchase_date=request.purchase_date or date.today(),
        purchase_price=request.purchase_price,
    )
    db.add(holding)

    account.cash_balance -= total_cost

    transaction = transaction_repository.build_transaction(
        account_id=account.id,
        type=TransactionType.BUY,
        ticker=_label(holding),
        quantity=request.face_value,
        price=request.purchase_price,
        amount=total_cost,
        cash_balance_after=account.cash_balance,
    )
    _commit(db, transaction)
    db.refresh(holding)
    return holding


def execute_treasury_sell(
    db: Session, user: User, holding_id: int, request: TreasurySellRequest
) -> Transaction | None:
    account = account_repository.get_account(db, user)
    holding = treasury_repository.get_treasury_holding(db, account.id, holding_id)
    if holding is None:
        return None

    face_value = holding.face_value
    label = _label(holding)
    cost_basis = face_value / Decimal("100") * holding.purchase_price
    proceeds = face_value / Decimal("100") * request.sale_price
    realized_gain_loss = proceeds - cost_basis

    account.cash_balance += proceeds

    db.delete(holding)

    transaction = transaction_repository.build_transaction(
        account_id=account.id,
        type=TransactionType.SELL,
        ticker=label,
        quantity=face_value,
        price=request.sale_price,
        amount=proceeds,
        realized_gain_loss=realized_gain_loss,
        cash_balance_after=account.cash_balance,
    )
    return _commit(db, transaction)
