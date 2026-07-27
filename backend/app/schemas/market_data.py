from decimal import Decimal

from pydantic import BaseModel


class PriceResponse(BaseModel):
    ticker: str
    price: Decimal


class PricePoint(BaseModel):
    timestamp: str
    close: float


class QuoteStats(BaseModel):
    open: float | None = None
    high: float | None = None
    low: float | None = None
    volume: int | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None
    avg_volume: int | None = None


class QuoteResponse(BaseModel):
    ticker: str
    name: str | None = None
    exchange: str | None = None
    currency: str | None = None
    price: float
    previous_close: float | None = None
    change: float
    change_percent: float | None = None
    points: list[PricePoint]
    stats: QuoteStats


class NewsItem(BaseModel):
    title: str
    summary: str | None = None
    published_at: str | None = None
    source: str | None = None
    url: str | None = None


class NewsResponse(BaseModel):
    ticker: str
    items: list[NewsItem]
