"""Client for the St. Louis Fed's FRED API.

Fetches the daily US Treasury constant-maturity yield curve. Kept isolated
from the pricing/valuation logic that consumes it so the HTTP calls can be
swapped out or mocked in tests.

Results are cached in-memory so buy dialogs and batch valuations do not
hammer FRED (eight series per uncached call).
"""

from datetime import datetime, timezone
from decimal import Decimal
from threading import Lock
import time

import requests

from app.config import settings

FRED_OBSERVATIONS_URL = "https://api.stlouisfed.org/fred/series/observations"

# Maps each FRED constant-maturity Treasury series to its tenor in years.
YIELD_CURVE_SERIES: dict[str, float] = {
    "DGS1MO": 1 / 12,
    "DGS3MO": 3 / 12,
    "DGS6MO": 6 / 12,
    "DGS1": 1.0,
    "DGS2": 2.0,
    "DGS5": 5.0,
    "DGS10": 10.0,
    "DGS30": 30.0,
}

# Cache TTL — long enough to protect FRED rate limits during a session.
_CACHE_TTL_SECONDS = 30 * 60

_cache_lock = Lock()
_cached_curve: dict[float, Decimal] | None = None
_cached_at: float | None = None
_cached_as_of: datetime | None = None


class FredApiError(Exception):
    """Raised when the FRED API key is missing or a request/response fails."""


def _get_api_key() -> str:
    if not settings.fred_api_key:
        raise FredApiError(
            "FRED_API_KEY is not configured. Set it in the environment or .env file."
        )
    return settings.fred_api_key


def _fetch_latest_observation(series_id: str, api_key: str) -> Decimal | None:
    """Return the most recent non-missing value for one FRED series, or None."""

    try:
        response = requests.get(
            FRED_OBSERVATIONS_URL,
            params={
                "series_id": series_id,
                "api_key": api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 10,
            },
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise FredApiError(f"Could not fetch {series_id} from FRED.") from exc

    payload = response.json()
    for observation in payload.get("observations", []):
        value = observation.get("value")
        # FRED marks non-trading days / missing prints with ".".
        if value and value != ".":
            return Decimal(value)

    return None


def _fetch_yield_curve() -> dict[float, Decimal]:
    api_key = _get_api_key()

    curve: dict[float, Decimal] = {}
    for series_id, tenor_years in YIELD_CURVE_SERIES.items():
        value = _fetch_latest_observation(series_id, api_key)
        if value is not None:
            curve[tenor_years] = value

    if not curve:
        raise FredApiError("FRED returned no usable Treasury yield observations.")

    return curve


def get_yield_curve(*, force_refresh: bool = False) -> dict[float, Decimal]:
    """
    Fetch the current daily Treasury yield curve from FRED.

    Returns a mapping of tenor-in-years -> yield (as a percentage, e.g.
    Decimal("4.25") means 4.25%) covering the 1-month through 30-year
    constant-maturity series. A tenor is omitted if FRED has no recent
    observation for it.

    Cached for `_CACHE_TTL_SECONDS` unless `force_refresh` is True.
    """

    global _cached_curve, _cached_at, _cached_as_of

    now = time.monotonic()
    with _cache_lock:
        if (
            not force_refresh
            and _cached_curve is not None
            and _cached_at is not None
            and (now - _cached_at) < _CACHE_TTL_SECONDS
        ):
            return dict(_cached_curve)

        curve = _fetch_yield_curve()
        _cached_curve = curve
        _cached_at = now
        _cached_as_of = datetime.now(timezone.utc)
        return dict(curve)


def get_yield_curve_as_of() -> datetime | None:
    """UTC timestamp of the last successful curve fetch (None if never cached)."""

    with _cache_lock:
        return _cached_as_of
