"""ORM models mapping to database tables."""

import enum

from sqlalchemy import Column, Date, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String, func

from app.database.connection import Base


class TransactionType(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"


class TreasuryType(str, enum.Enum):
    BILL = "BILL"
    NOTE = "NOTE"
    BOND = "BOND"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ticker = Column(String(20), nullable=False, index=True)
    quantity_added = Column(Numeric(18, 6), nullable=False)
    purchase_price = Column(Numeric(18, 6), nullable=False)
    purchase_date = Column(Date, nullable=True)


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ticker = Column(String(20), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=0)


class Account(Base):
    """A user's brokerage account. Cash balance is funded by transfers."""

    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    cash_balance = Column(Numeric(18, 6), nullable=False, default=0)


class Transaction(Base):
    """Append-only ledger of every buy, sell, and transfer (mirrors a brokerage activity feed)."""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    type = Column(SAEnum(TransactionType), nullable=False)
    ticker = Column(String(20), nullable=True, index=True)
    quantity = Column(Numeric(18, 6), nullable=True)
    price = Column(Numeric(18, 6), nullable=True)
    amount = Column(Numeric(18, 6), nullable=False)
    realized_gain_loss = Column(Numeric(18, 6), nullable=True)
    cash_balance_after = Column(Numeric(18, 6), nullable=False)
    executed_at = Column(DateTime, nullable=False, server_default=func.now())


class TreasuryHolding(Base):
    """A single lot of a US Treasury bill/note/bond held in the account."""

    __tablename__ = "treasury_holdings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    treasury_type = Column(SAEnum(TreasuryType), nullable=False)
    face_value = Column(Numeric(18, 6), nullable=False)
    coupon_rate = Column(Numeric(9, 6), nullable=False)
    coupon_frequency = Column(Integer, nullable=False, default=2)
    maturity_date = Column(Date, nullable=False)
    purchase_date = Column(Date, nullable=False)
    purchase_price = Column(Numeric(18, 6), nullable=False)
