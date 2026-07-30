"""Discounted cash flow pricing for US Treasury bills, notes, and bonds."""

from datetime import date
from decimal import Decimal


class BondPricingError(Exception):
    """Raised when a bond cannot be priced against the supplied yield curve."""


def _nearest_tenor_yield(
    years_to_maturity: Decimal, yield_curve: dict[float, Decimal]
) -> Decimal:
    """Match years_to_maturity to the closest published tenor and return its yield (a percentage)."""

    if not yield_curve:
        raise BondPricingError("Yield curve is empty.")

    closest_tenor = min(
        yield_curve, key=lambda tenor: abs(Decimal(str(tenor)) - years_to_maturity)
    )
    return yield_curve[closest_tenor]


def price_treasury(
    face_value: Decimal,
    coupon_rate: Decimal,
    coupon_frequency: int,
    maturity_date: date,
    yield_curve: dict[float, Decimal],
    as_of_date: date | None = None,
) -> Decimal:
    """
    Estimate the present-value price of a Treasury holding via discounted cash flow.

    Args:
        face_value: par value of the holding.
        coupon_rate: annual coupon rate as a percentage (e.g. Decimal("4.25") for 4.25%).
        coupon_frequency: coupon payments per year (2 for semi-annual notes/bonds,
            0 for a zero-coupon bill).
        maturity_date: the date the holding redeems at face value.
        yield_curve: tenor-in-years -> yield-as-percentage, e.g. from
            fred_client.get_yield_curve().
        as_of_date: valuation date; defaults to today.

    Returns:
        The estimated present value in dollars (not a per-100 price).
    """

    if face_value <= 0:
        raise ValueError("face_value must be positive.")
    if coupon_rate < 0:
        raise ValueError("coupon_rate cannot be negative.")

    as_of_date = as_of_date or date.today()
    days_to_maturity = (maturity_date - as_of_date).days
    if days_to_maturity <= 0:
        raise ValueError("maturity_date must be after as_of_date.")

    years_to_maturity = Decimal(days_to_maturity) / Decimal("365.25")
    market_yield = _nearest_tenor_yield(years_to_maturity, yield_curve) / Decimal("100")

    if coupon_frequency <= 0:
        # Zero-coupon instrument (Treasury bill): one discounted redemption at face value.
        return face_value / (1 + market_yield) ** years_to_maturity

    periodic_rate = market_yield / coupon_frequency
    coupon_payment = face_value * (coupon_rate / Decimal("100")) / coupon_frequency
    total_periods = max(
        int((years_to_maturity * coupon_frequency).to_integral_value(rounding="ROUND_HALF_UP")),
        1,
    )

    present_value = Decimal("0")
    for period in range(1, total_periods + 1):
        cash_flow = coupon_payment
        if period == total_periods:
            cash_flow += face_value
        present_value += cash_flow / (1 + periodic_rate) ** period

    return present_value
