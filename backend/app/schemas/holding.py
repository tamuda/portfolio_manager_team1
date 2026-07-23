
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, ValidationError, Field

class HoldingCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    quantity_added: Decimal = Field(gt=0)
    purchase_price: Decimal = Field(ge=0)
    purchase_date: date

class HoldingUpdate(BaseModel):
    ticker: str | None = Field(default=None, min_length=1, max_length=20)
    quantity_added: Decimal | None = Field(default=None, gt=0)
    purchase_price: Decimal | None = Field(default=None, ge=0)
    purchase_date: date | None = None

class HoldingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticker: str
    quantity_added: Decimal
    purchase_price: Decimal
    purchase_date: date | None = None


class HoldingPerformanceResponse(HoldingResponse):
    current_price: Decimal
    cost_basis: Decimal
    market_value: Decimal
    gain_loss: Decimal
    gain_loss_percentage: Decimal | None

class PortfolioSummaryResponse(BaseModel):
    total_cost_basis: Decimal
    total_market_value: Decimal
    total_gain_loss: Decimal
    portfolio_return_percentage: Decimal