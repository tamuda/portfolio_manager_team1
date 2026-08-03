"""Unit tests for app.services.bond_pricing_service."""

from datetime import date
from decimal import Decimal

import pytest

from app.services.bond_pricing_service import (
    BondPricingError,
    _nearest_tenor_yield,
    price_treasury,
)


CURVE = {
    0.25: Decimal("5.00"),
    2.0: Decimal("4.00"),
    10.0: Decimal("3.50"),
}


def test_price_treasury_zero_coupon_bill_path():
    as_of = date(2026, 1, 1)
    maturity = date(2027, 1, 1)
    years = Decimal((maturity - as_of).days) / Decimal("365.25")
    expected = Decimal("1000") / (Decimal("1") + Decimal("0.04")) ** years

    value = price_treasury(
        face_value=Decimal("1000"),
        coupon_rate=Decimal("0"),
        coupon_frequency=0,
        maturity_date=maturity,
        yield_curve={1.0: Decimal("4.00")},
        as_of_date=as_of,
    )

    assert value == expected


def test_price_treasury_coupon_bearing_note_path():
    # 1 year, 4% coupon semi-annual, curve yield also 4% → near par.
    value = price_treasury(
        face_value=Decimal("1000"),
        coupon_rate=Decimal("4.00"),
        coupon_frequency=2,
        maturity_date=date(2027, 1, 1),
        yield_curve={1.0: Decimal("4.00")},
        as_of_date=date(2026, 1, 1),
    )

    assert value == pytest.approx(Decimal("1000"), abs=Decimal("0.05"))


def test_price_treasury_rejects_non_positive_face_value():
    with pytest.raises(ValueError, match="face_value must be positive"):
        price_treasury(
            face_value=Decimal("0"),
            coupon_rate=Decimal("4"),
            coupon_frequency=2,
            maturity_date=date(2030, 1, 1),
            yield_curve=CURVE,
            as_of_date=date(2026, 1, 1),
        )


def test_price_treasury_rejects_negative_coupon_rate():
    with pytest.raises(ValueError, match="coupon_rate cannot be negative"):
        price_treasury(
            face_value=Decimal("1000"),
            coupon_rate=Decimal("-0.01"),
            coupon_frequency=2,
            maturity_date=date(2030, 1, 1),
            yield_curve=CURVE,
            as_of_date=date(2026, 1, 1),
        )


def test_price_treasury_rejects_past_maturity_date():
    with pytest.raises(ValueError, match="maturity_date must be after as_of_date"):
        price_treasury(
            face_value=Decimal("1000"),
            coupon_rate=Decimal("4"),
            coupon_frequency=2,
            maturity_date=date(2025, 12, 31),
            yield_curve=CURVE,
            as_of_date=date(2026, 1, 1),
        )


def test_nearest_tenor_yield_picks_closest_tenor():
    # 1.6y is closer to 2y (0.4) than to 0.25y (1.35)
    assert _nearest_tenor_yield(Decimal("1.6"), CURVE) == Decimal("4.00")
    # 0.3y is closer to 0.25y
    assert _nearest_tenor_yield(Decimal("0.3"), CURVE) == Decimal("5.00")
    # Exact match
    assert _nearest_tenor_yield(Decimal("10"), CURVE) == Decimal("3.50")


def test_nearest_tenor_yield_empty_curve_raises():
    with pytest.raises(BondPricingError, match="Yield curve is empty"):
        _nearest_tenor_yield(Decimal("2"), {})
