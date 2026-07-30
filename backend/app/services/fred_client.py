"""Client for the St. Louis Fed's FRED API.

Fetches the daily US Treasury constant-maturity yield curve. Kept isolated
from the pricing/valuation logic that consumes it so the HTTP calls can be
swapped out or mocked in tests.
"""

from decimal import Decimal

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


def get_yield_curve() -> dict[float, Decimal]:
    """
    Fetch the current daily Treasury yield curve from FRED.

    Returns a mapping of tenor-in-years -> yield (as a percentage, e.g.
    Decimal("4.25") means 4.25%) covering the 1-month through 30-year
    constant-maturity series. A tenor is omitted if FRED has no recent
    observation for it.
    """

    api_key = _get_api_key()

    curve: dict[float, Decimal] = {}
    for series_id, tenor_years in YIELD_CURVE_SERIES.items():
        value = _fetch_latest_observation(series_id, api_key)
        if value is not None:
            curve[tenor_years] = value

    if not curve:
        raise FredApiError("FRED returned no usable Treasury yield observations.")

    return curve
