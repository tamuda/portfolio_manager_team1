from decimal import Decimal

from pydantic import BaseModel


class PriceResponse(BaseModel):
    ticker: str
    price: Decimal
