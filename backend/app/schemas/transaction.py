from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TransactionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"


class TransferDirection(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"


class BuyRequest(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    quantity: Decimal = Field(gt=0)
    price: Decimal = Field(gt=0)
    trade_date: date | None = None


class SellRequest(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    quantity: Decimal = Field(gt=0)
    price: Decimal = Field(gt=0)


class TransferRequest(BaseModel):
    direction: TransferDirection
    amount: Decimal = Field(gt=0)


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: TransactionType
    ticker: str | None
    quantity: Decimal | None
    price: Decimal | None
    amount: Decimal
    realized_gain_loss: Decimal | None
    cash_balance_after: Decimal
    executed_at: datetime


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cash_balance: Decimal
