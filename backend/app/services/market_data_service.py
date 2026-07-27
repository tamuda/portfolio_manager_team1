import math
from decimal import Decimal

import yfinance as yf


class MarketDataError(Exception):
    """Raised when a stock price cannot be retrieved."""


# Maps a chart time range to the (period, interval) yfinance expects.
# 1D uses 1m so early-session sparklines/charts aren't just two 5m bars.
RANGE_PARAMS: dict[str, tuple[str, str]] = {
    "1D": ("1d", "1m"),
    "1W": ("5d", "30m"),
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
    "6M": ("6mo", "1d"),
    "YTD": ("ytd", "1d"),
    "1Y": ("1y", "1wk"),
    "2Y": ("2y", "1wk"),
    "5Y": ("5y", "1wk"),
    "10Y": ("10y", "1mo"),
    "ALL": ("max", "1mo"),
}


def _safe_float(value: object) -> float | None:
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return None if math.isnan(number) else number


def _safe_int(value: object) -> int | None:
    number = _safe_float(value)
    return int(number) if number is not None else None


def get_latest_price(ticker: str) -> Decimal:
    # Clean the ticker entered by the user
    ticker = ticker.strip().upper()

    if not ticker:
        raise ValueError("Ticker cannot be empty.")

    # Create a yfinance object for the stock
    stock = yf.Ticker(ticker)

    try:
        # Retrieve recent daily market data
        history = stock.history(
            period="5d",
            interval="1d",
            auto_adjust=False,
        )
    except Exception as exc:
        raise MarketDataError(
            f"Could not retrieve market data for {ticker}."
        ) from exc

    # Check that data was returned
    if history.empty:
        raise MarketDataError(
            f"No market data was found for {ticker}."
        )

    # Get valid closing prices
    closing_prices = history["Close"].dropna()

    if closing_prices.empty:
        raise MarketDataError(
            f"No closing price was found for {ticker}."
        )

    # Get the most recent closing price
    latest_price = closing_prices.iloc[-1]

    return Decimal(str(latest_price))


def get_quote(ticker: str, range_key: str) -> dict:
    """
    Build the data needed for the Watchlist detail view: current price and
    day change (always based on the latest close vs. the prior close),
    a chart series for the requested range, and a stats block.

    52-week high/low and average volume are always computed from a trailing
    year of daily data, independent of which chart range is selected —
    matching how Apple's Stocks app keeps those figures range-independent.
    """
    ticker = ticker.strip().upper()

    if not ticker:
        raise ValueError("Ticker cannot be empty.")

    if range_key not in RANGE_PARAMS:
        raise ValueError(f"Unsupported range: {range_key}")

    stock = yf.Ticker(ticker)

    try:
        yearly = stock.history(period="1y", interval="1d", auto_adjust=False)
    except Exception as exc:
        raise MarketDataError(
            f"Could not retrieve market data for {ticker}."
        ) from exc

    if yearly.empty:
        raise MarketDataError(f"No market data was found for {ticker}.")

    closes = yearly["Close"].dropna()
    if closes.empty:
        raise MarketDataError(f"No closing price was found for {ticker}.")

    price = float(closes.iloc[-1])
    previous_close = float(closes.iloc[-2]) if len(closes) > 1 else None
    change = price - previous_close if previous_close is not None else 0.0
    change_percent = (
        (change / previous_close) * 100 if previous_close else None
    )

    last_row = yearly.iloc[-1]
    stats = {
        "open": _safe_float(last_row.get("Open")),
        "high": _safe_float(last_row.get("High")),
        "low": _safe_float(last_row.get("Low")),
        "volume": _safe_int(last_row.get("Volume")),
        "fifty_two_week_high": _safe_float(yearly["High"].max()),
        "fifty_two_week_low": _safe_float(yearly["Low"].min()),
        "avg_volume": _safe_int(yearly["Volume"].tail(63).mean()),
    }

    period, interval = RANGE_PARAMS[range_key]
    try:
        range_history = stock.history(
            period=period, interval=interval, auto_adjust=False
        )
    except Exception as exc:
        raise MarketDataError(
            f"Could not retrieve chart data for {ticker}."
        ) from exc

    close_series = range_history["Close"].dropna()
    points = [
        {"timestamp": timestamp.isoformat(), "close": float(value)}
        for timestamp, value in close_series.items()
    ]

    name = None
    exchange = None
    currency = None
    try:
        info = stock.info
        name = info.get("longName") or info.get("shortName")
        exchange = info.get("exchange")
        currency = info.get("currency")
    except Exception:
        # Metadata is a nice-to-have — never fail the quote over it.
        pass

    return {
        "ticker": ticker,
        "name": name,
        "exchange": exchange,
        "currency": currency,
        "price": price,
        "previous_close": previous_close,
        "change": change,
        "change_percent": change_percent,
        "points": points,
        "stats": stats,
    }


def get_news(ticker: str, limit: int = 5) -> list[dict]:
    """
    Recent headlines for a ticker (Yahoo Finance via yfinance).
    Returns at most `limit` items, newest first. Missing fields stay None.
    """
    ticker = ticker.strip().upper()

    if not ticker:
        raise ValueError("Ticker cannot be empty.")

    if limit < 1:
        raise ValueError("limit must be at least 1.")

    stock = yf.Ticker(ticker)

    try:
        raw_news = stock.news or []
    except Exception as exc:
        raise MarketDataError(
            f"Could not retrieve news for {ticker}."
        ) from exc

    items: list[dict] = []
    for entry in raw_news:
        content = entry.get("content") if isinstance(entry, dict) else None
        if not isinstance(content, dict):
            continue

        title = content.get("title")
        if not title:
            continue

        provider = content.get("provider") or {}
        canonical = content.get("canonicalUrl") or {}
        click_through = content.get("clickThroughUrl") or {}
        url = None
        if isinstance(canonical, dict):
            url = canonical.get("url")
        if not url and isinstance(click_through, dict):
            url = click_through.get("url")

        source = None
        if isinstance(provider, dict):
            source = provider.get("displayName")

        items.append(
            {
                "title": title,
                "summary": content.get("summary") or content.get("description"),
                "published_at": content.get("pubDate") or None,
                "source": source,
                "url": url,
            }
        )

        if len(items) >= limit:
            break

    return items