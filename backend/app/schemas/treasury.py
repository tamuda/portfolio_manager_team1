from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TreasuryType(str, Enum):
    BILL = "BILL"
    NOTE = "NOTE"
    BOND = "BOND"


class TreasuryBuyRequest(BaseModel):
    """
    purchase_price and (later) sale_price are quoted per 100 of face value,
    matching how Treasury prices are dealt/displayed (e.g. 98.50 means $985
    per $1,000 face). coupon_frequency is payments per year — 2 for
    semi-annual notes/bonds, 0 for a zero-coupon bill.
    """

    treasury_type: TreasuryType
    face_value: Decimal = Field(gt=0)
    coupon_rate: Decimal = Field(ge=0)
    coupon_frequency: int = Field(default=2, ge=0, le=12)
    maturity_date: date
    purchase_price: Decimal = Field(gt=0)
    purchase_date: date | None = None


class TreasurySellRequest(BaseModel):
    sale_price: Decimal = Field(gt=0)


class TreasuryHoldingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    treasury_type: TreasuryType
    face_value: Decimal
    coupon_rate: Decimal
    coupon_frequency: int
    maturity_date: date
    purchase_date: date
    purchase_price: Decimal


class TreasuryValuationResponse(TreasuryHoldingResponse):
    current_price: Decimal
    cost_basis: Decimal
    market_value: Decimal
    gain_loss: Decimal
    gain_loss_percentage: Decimal


class YieldCurvePoint(BaseModel):
    tenor_years: float
    yield_percent: Decimal


class YieldCurveResponse(BaseModel):
    as_of: datetime | None
    points: list[YieldCurvePoint]


class TreasurySellResponse(BaseModel):
    holding_id: int
    ticker: str
    proceeds: Decimal
    cost_basis: Decimal
    realized_gain_loss: Decimal
    cash_balance_after: Decimal
