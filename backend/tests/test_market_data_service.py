import math

import pandas as pd
import pytest

from app.services import market_data_service
from app.services.market_data_service import (
    MarketDataError,
    _safe_float,
    _safe_int,
    get_latest_price,
    get_news,
    get_quote,
)


def make_history_df(closes, opens=None, highs=None, lows=None, volumes=None, start="2024-01-01"):
    """Build a fake yfinance-shaped DataFrame: DatetimeIndex + OHLCV columns."""
    n = len(closes)
    index = pd.date_range(start=start, periods=n, freq="D")
    return pd.DataFrame(
        {
            "Open": opens or closes,
            "High": highs or closes,
            "Low": lows or closes,
            "Close": closes,
            "Volume": volumes or [1_000_000] * n,
        },
        index=index,
    )


class FakeStock:
    """Stands in for yf.Ticker(...) — history() is keyed by (period, interval)."""

    def __init__(self, history_by_call=None, history_exc=None, news=None, news_exc=None, info=None, info_exc=None):
        self._history_by_call = history_by_call or {}
        self._history_exc = history_exc
        self._news = news
        self._news_exc = news_exc
        self._info = info
        self._info_exc = info_exc

    def history(self, period, interval, auto_adjust=False):
        if self._history_exc:
            raise self._history_exc
        return self._history_by_call[(period, interval)]

    @property
    def news(self):
        if self._news_exc:
            raise self._news_exc
        return self._news

    @property
    def info(self):
        if self._info_exc:
            raise self._info_exc
        return self._info


def use_fake_stock(monkeypatch, fake_stock):
    monkeypatch.setattr(market_data_service.yf, "Ticker", lambda ticker: fake_stock)


# --- _safe_float / _safe_int -------------------------------------------------


def test_safe_float_converts_valid_number():
    assert _safe_float("4.5") == 4.5


def test_safe_float_returns_none_for_nan():
    assert _safe_float(math.nan) is None


def test_safe_float_returns_none_for_invalid_string():
    assert _safe_float("not-a-number") is None


def test_safe_float_returns_none_for_none():
    assert _safe_float(None) is None


def test_safe_int_truncates_valid_float():
    assert _safe_int(4.9) == 4


def test_safe_int_returns_none_for_nan():
    assert _safe_int(math.nan) is None


# --- get_latest_price ---------------------------------------------------------


def test_get_latest_price_empty_ticker_raises_value_error():
    with pytest.raises(ValueError):
        get_latest_price("  ")


def test_get_latest_price_returns_latest_close(monkeypatch):
    df = make_history_df(closes=[100.0, 105.0, 110.0])
    fake_stock = FakeStock(history_by_call={("5d", "1d"): df})
    use_fake_stock(monkeypatch, fake_stock)

    price = get_latest_price("aapl")

    assert price == pytest.approx(110.0)


def test_get_latest_price_no_data_raises_market_data_error(monkeypatch):
    fake_stock = FakeStock(history_by_call={("5d", "1d"): pd.DataFrame()})
    use_fake_stock(monkeypatch, fake_stock)

    with pytest.raises(MarketDataError):
        get_latest_price("AAPL")


def test_get_latest_price_all_nan_closes_raises_market_data_error(monkeypatch):
    df = make_history_df(closes=[math.nan, math.nan])
    fake_stock = FakeStock(history_by_call={("5d", "1d"): df})
    use_fake_stock(monkeypatch, fake_stock)

    with pytest.raises(MarketDataError):
        get_latest_price("AAPL")


def test_get_latest_price_wraps_history_exception(monkeypatch):
    fake_stock = FakeStock(history_exc=RuntimeError("network down"))
    use_fake_stock(monkeypatch, fake_stock)

    with pytest.raises(MarketDataError):
        get_latest_price("AAPL")


# --- get_quote ----------------------------------------------------------------


def test_get_quote_empty_ticker_raises_value_error():
    with pytest.raises(ValueError):
        get_quote("", "1D")


def test_get_quote_unsupported_range_raises_value_error(monkeypatch):
    fake_stock = FakeStock(history_by_call={("1y", "1d"): make_history_df(closes=[100.0])})
    use_fake_stock(monkeypatch, fake_stock)

    with pytest.raises(ValueError):
        get_quote("AAPL", "3Y")


def test_get_quote_computes_price_change_and_stats(monkeypatch):
    yearly = make_history_df(
        closes=[100.0, 105.0, 110.0],
        opens=[99.0, 104.0, 109.0],
        highs=[101.0, 106.0, 112.0],
        lows=[98.0, 103.0, 108.0],
        volumes=[1000, 1100, 1200],
    )
    range_history = make_history_df(closes=[200.0, 210.0])
    fake_stock = FakeStock(
        history_by_call={
            ("1y", "1d"): yearly,
            ("1mo", "1d"): range_history,  # RANGE_PARAMS["1M"]
        },
        info={"longName": "Apple Inc.", "exchange": "NASDAQ", "currency": "USD"},
    )
    use_fake_stock(monkeypatch, fake_stock)

    quote = get_quote("aapl", "1M")

    assert quote["ticker"] == "AAPL"
    assert quote["price"] == pytest.approx(110.0)
    assert quote["previous_close"] == pytest.approx(105.0)
    assert quote["change"] == pytest.approx(5.0)
    assert quote["change_percent"] == pytest.approx((5.0 / 105.0) * 100)
    assert quote["name"] == "Apple Inc."
    assert quote["exchange"] == "NASDAQ"
    assert quote["currency"] == "USD"

    stats = quote["stats"]
    assert stats["open"] == pytest.approx(109.0)
    assert stats["high"] == pytest.approx(112.0)
    assert stats["low"] == pytest.approx(108.0)
    assert stats["volume"] == 1200
    assert stats["fifty_two_week_high"] == pytest.approx(112.0)
    assert stats["fifty_two_week_low"] == pytest.approx(98.0)
    assert stats["avg_volume"] == 1100

    assert [p["close"] for p in quote["points"]] == [200.0, 210.0]


def test_get_quote_single_data_point_has_no_previous_close(monkeypatch):
    yearly = make_history_df(closes=[100.0])
    range_history = make_history_df(closes=[100.0])
    fake_stock = FakeStock(
        history_by_call={("1y", "1d"): yearly, ("1d", "1m"): range_history},
        info={},
    )
    use_fake_stock(monkeypatch, fake_stock)

    quote = get_quote("AAPL", "1D")

    assert quote["previous_close"] is None
    assert quote["change"] == 0.0
    assert quote["change_percent"] is None


def test_get_quote_info_failure_leaves_metadata_none(monkeypatch):
    yearly = make_history_df(closes=[100.0, 105.0])
    range_history = make_history_df(closes=[100.0, 105.0])
    fake_stock = FakeStock(
        history_by_call={("1y", "1d"): yearly, ("1d", "1m"): range_history},
        info_exc=RuntimeError("metadata unavailable"),
    )
    use_fake_stock(monkeypatch, fake_stock)

    quote = get_quote("AAPL", "1D")

    assert quote["name"] is None
    assert quote["exchange"] is None
    assert quote["currency"] is None


def test_get_quote_no_yearly_data_raises_market_data_error(monkeypatch):
    fake_stock = FakeStock(history_by_call={("1y", "1d"): pd.DataFrame()})
    use_fake_stock(monkeypatch, fake_stock)

    with pytest.raises(MarketDataError):
        get_quote("AAPL", "1D")


# --- get_news -------------------------------------------------------------


def test_get_news_empty_ticker_raises_value_error():
    with pytest.raises(ValueError):
        get_news("   ")


def test_get_news_limit_less_than_one_raises_value_error():
    with pytest.raises(ValueError):
        get_news("AAPL", limit=0)


def test_get_news_parses_items_and_respects_limit(monkeypatch):
    raw_news = [
        {
            "content": {
                "title": "Apple hits new high",
                "summary": "Shares climbed today.",
                "pubDate": "2026-08-01T12:00:00Z",
                "provider": {"displayName": "Reuters"},
                "canonicalUrl": {"url": "https://example.com/a"},
            }
        },
        {
            "content": {
                "title": "Apple announces event",
                "clickThroughUrl": {"url": "https://example.com/b"},
            }
        },
        {
            "content": {
                "title": "Third story, should be truncated by limit",
            }
        },
    ]
    fake_stock = FakeStock(news=raw_news)
    use_fake_stock(monkeypatch, fake_stock)

    items = get_news("AAPL", limit=2)

    assert len(items) == 2
    assert items[0]["title"] == "Apple hits new high"
    assert items[0]["source"] == "Reuters"
    assert items[0]["url"] == "https://example.com/a"
    assert items[1]["url"] == "https://example.com/b"


def test_get_news_skips_entries_without_title(monkeypatch):
    raw_news = [
        {"content": {"summary": "No title here"}},
        {"content": {"title": "Has a title"}},
    ]
    fake_stock = FakeStock(news=raw_news)
    use_fake_stock(monkeypatch, fake_stock)

    items = get_news("AAPL")

    assert len(items) == 1
    assert items[0]["title"] == "Has a title"


def test_get_news_wraps_news_exception(monkeypatch):
    fake_stock = FakeStock(news_exc=RuntimeError("network down"))
    use_fake_stock(monkeypatch, fake_stock)

    with pytest.raises(MarketDataError):
        get_news("AAPL")
