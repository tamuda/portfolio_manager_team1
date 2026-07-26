"""Business logic for buys, sells, and cash transfers against the brokerage account.

Each operation mutates holdings/cash balance and appends one row to the
transactions ledger, all committed together so a failure leaves no partial
trade behind.
"""

from datetime import date
from decimal import Decimal

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.models import Holding, Transaction, TransactionType
from app.repositories import account_repository, holding_repository, transaction_repository
from app.schemas.transaction import BuyRequest, SellRequest, TransferDirection, TransferRequest


class InsufficientFundsError(Exception):
    """Raised when a buy or withdrawal would overdraw the account's cash balance."""


class InsufficientSharesError(Exception):
    """Raised when a sell quantity exceeds the shares currently held for that ticker."""


def _commit(db: Session, transaction: Transaction) -> Transaction:
    db.add(transaction)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(transaction)
    return transaction


def execute_buy(db: Session, request: BuyRequest) -> Transaction:
    ticker = request.ticker.strip().upper()
    total_cost = request.quantity * request.price

    account = account_repository.get_account(db)
    if total_cost > account.cash_balance:
        raise InsufficientFundsError(
            f"Buying {request.quantity} {ticker} at {request.price} costs "
            f"{total_cost}, which exceeds the available cash balance of "
            f"{account.cash_balance}."
        )

    db.add(
        Holding(
            ticker=ticker,
            quantity_added=request.quantity,
            purchase_price=request.price,
            purchase_date=request.trade_date or date.today(),
        )
    )

    account.cash_balance -= total_cost

    transaction = transaction_repository.build_transaction(
        account_id=account.id,
        type=TransactionType.BUY,
        ticker=ticker,
        quantity=request.quantity,
        price=request.price,
        amount=total_cost,
        cash_balance_after=account.cash_balance,
    )
    return _commit(db, transaction)


def execute_sell(db: Session, request: SellRequest) -> Transaction:
    ticker = request.ticker.strip().upper()

    lots = holding_repository.get_holdings_by_ticker(db, ticker)
    available = sum((lot.quantity_added for lot in lots), Decimal("0"))
    if request.quantity > available:
        raise InsufficientSharesError(
            f"Cannot sell {request.quantity} shares of {ticker}: only "
            f"{available} are held."
        )

    remaining = request.quantity
    cost_basis_sold = Decimal("0")
    for lot in lots:
        if remaining <= 0:
            break
        qty_from_lot = min(remaining, lot.quantity_added)
        cost_basis_sold += qty_from_lot * lot.purchase_price
        remaining -= qty_from_lot

        if qty_from_lot == lot.quantity_added:
            db.delete(lot)
        else:
            lot.quantity_added -= qty_from_lot

    proceeds = request.quantity * request.price
    realized_gain_loss = proceeds - cost_basis_sold

    account = account_repository.get_account(db)
    account.cash_balance += proceeds

    transaction = transaction_repository.build_transaction(
        account_id=account.id,
        type=TransactionType.SELL,
        ticker=ticker,
        quantity=request.quantity,
        price=request.price,
        amount=proceeds,
        realized_gain_loss=realized_gain_loss,
        cash_balance_after=account.cash_balance,
    )
    return _commit(db, transaction)


def execute_transfer(db: Session, request: TransferRequest) -> Transaction:
    account = account_repository.get_account(db)

    if request.direction == TransferDirection.WITHDRAWAL:
        if request.amount > account.cash_balance:
            raise InsufficientFundsError(
                f"Cannot withdraw {request.amount}: available cash balance is "
                f"{account.cash_balance}."
            )
        account.cash_balance -= request.amount
        transaction_type = TransactionType.TRANSFER_OUT
    else:
        account.cash_balance += request.amount
        transaction_type = TransactionType.TRANSFER_IN

    transaction = transaction_repository.build_transaction(
        account_id=account.id,
        type=transaction_type,
        amount=request.amount,
        cash_balance_after=account.cash_balance,
    )
    return _commit(db, transaction)
