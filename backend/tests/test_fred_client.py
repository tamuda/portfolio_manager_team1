"""Unit tests for app.services.fred_client (requests.get mocked)."""

from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from app.services import fred_client
from app.services.fred_client import (
    FredApiError,
    YIELD_CURVE_SERIES,
    _fetch_latest_observation,
    get_yield_curve,
)


@pytest.fixture(autouse=True)
def clear_fred_cache():
    """Isolate cache state across tests."""
    fred_client._cached_curve = None
    fred_client._cached_at = None
    fred_client._cached_as_of = None
    yield
    fred_client._cached_curve = None
    fred_client._cached_at = None
    fred_client._cached_as_of = None


def _ok_response(value: str) -> MagicMock:
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = {
        "observations": [{"value": value}],
    }
    return response


def test_missing_fred_api_key_raises(monkeypatch):
    monkeypatch.setattr(fred_client.settings, "fred_api_key", None)

    with pytest.raises(FredApiError, match="FRED_API_KEY is not configured"):
        get_yield_curve()


def test_dot_missing_value_marker_is_skipped(monkeypatch):
    monkeypatch.setattr(fred_client.settings, "fred_api_key", "test-key")

    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = {
        "observations": [
            {"value": "."},
            {"value": "."},
            {"value": "4.25"},
        ],
    }
    monkeypatch.setattr(fred_client.requests, "get", lambda *a, **k: response)

    assert _fetch_latest_observation("DGS10", "test-key") == Decimal("4.25")


def test_cache_hit_skips_second_network_fetch(monkeypatch):
    monkeypatch.setattr(fred_client.settings, "fred_api_key", "test-key")

    calls = {"n": 0}

    def fake_get(*_args, **_kwargs):
        calls["n"] += 1
        return _ok_response("4.00")

    monkeypatch.setattr(fred_client.requests, "get", fake_get)

    first = get_yield_curve()
    second = get_yield_curve()

    assert first == second
    assert len(first) == len(YIELD_CURVE_SERIES)
    # One GET per series on first call; cache hit on second.
    assert calls["n"] == len(YIELD_CURVE_SERIES)


def test_ttl_expired_refetches(monkeypatch):
    monkeypatch.setattr(fred_client.settings, "fred_api_key", "test-key")
    monkeypatch.setattr(fred_client, "_CACHE_TTL_SECONDS", 10)

    clock = {"t": 100.0}
    monkeypatch.setattr(fred_client.time, "monotonic", lambda: clock["t"])

    calls = {"n": 0}

    def fake_get(*_args, **_kwargs):
        calls["n"] += 1
        return _ok_response("4.00")

    monkeypatch.setattr(fred_client.requests, "get", fake_get)

    get_yield_curve()
    assert calls["n"] == len(YIELD_CURVE_SERIES)

    clock["t"] = 109.0  # still within TTL
    get_yield_curve()
    assert calls["n"] == len(YIELD_CURVE_SERIES)

    clock["t"] = 111.0  # past TTL
    get_yield_curve()
    assert calls["n"] == 2 * len(YIELD_CURVE_SERIES)


def test_force_refresh_bypasses_cache(monkeypatch):
    monkeypatch.setattr(fred_client.settings, "fred_api_key", "test-key")

    calls = {"n": 0}

    def fake_get(*_args, **_kwargs):
        calls["n"] += 1
        return _ok_response("4.00")

    monkeypatch.setattr(fred_client.requests, "get", fake_get)

    get_yield_curve()
    get_yield_curve(force_refresh=True)

    assert calls["n"] == 2 * len(YIELD_CURVE_SERIES)
