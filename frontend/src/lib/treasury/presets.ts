/**
 * Preset catalog for the Buy Treasury dialog.
 * Prices/coupons are suggested from the live FRED curve when available.
 */

import type { TreasuryType, YieldCurvePoint } from "@/types/treasury";

export type TreasuryPresetId =
  | "3m_bill"
  | "6m_bill"
  | "2y_note"
  | "5y_note"
  | "10y_note"
  | "30y_bond";

export type TreasuryPreset = {
  id: TreasuryPresetId;
  label: string;
  treasuryType: TreasuryType;
  /** Approximate tenor in years (matches FRED series). */
  tenorYears: number;
  couponFrequency: number;
};

export const TREASURY_PRESETS: TreasuryPreset[] = [
  {
    id: "3m_bill",
    label: "3M Bill",
    treasuryType: "BILL",
    tenorYears: 0.25,
    couponFrequency: 0,
  },
  {
    id: "6m_bill",
    label: "6M Bill",
    treasuryType: "BILL",
    tenorYears: 0.5,
    couponFrequency: 0,
  },
  {
    id: "2y_note",
    label: "2Y Note",
    treasuryType: "NOTE",
    tenorYears: 2,
    couponFrequency: 2,
  },
  {
    id: "5y_note",
    label: "5Y Note",
    treasuryType: "NOTE",
    tenorYears: 5,
    couponFrequency: 2,
  },
  {
    id: "10y_note",
    label: "10Y Note",
    treasuryType: "NOTE",
    tenorYears: 10,
    couponFrequency: 2,
  },
  {
    id: "30y_bond",
    label: "30Y Bond",
    treasuryType: "BOND",
    tenorYears: 30,
    couponFrequency: 2,
  },
];

export function addYearsToDate(base: Date, years: number): Date {
  const result = new Date(base);
  const wholeYears = Math.floor(years);
  const fraction = years - wholeYears;
  result.setFullYear(result.getFullYear() + wholeYears);
  if (fraction > 0) {
    result.setDate(result.getDate() + Math.round(fraction * 365.25));
  }
  return result;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Nearest curve yield (%) for a tenor. */
export function nearestYield(
  points: YieldCurvePoint[],
  tenorYears: number,
): number | null {
  if (points.length === 0) return null;
  let best = points[0];
  let bestDist = Math.abs(best.tenor_years - tenorYears);
  for (const point of points) {
    const dist = Math.abs(point.tenor_years - tenorYears);
    if (dist < bestDist) {
      best = point;
      bestDist = dist;
    }
  }
  return parseFloat(best.yield_percent);
}

/**
 * Simple model price per 100 face, mirroring backend DCF at a high level.
 * Bills: discount face. Notes/bonds: approximate par when coupon ≈ yield.
 */
export function suggestPricePerHundred(input: {
  treasuryType: TreasuryType;
  couponRate: number;
  couponFrequency: number;
  tenorYears: number;
  yieldPercent: number | null;
}): number {
  const y = input.yieldPercent;
  if (y === null || !Number.isFinite(y)) {
    return 100;
  }

  if (input.treasuryType === "BILL" || input.couponFrequency <= 0) {
    const years = Math.max(input.tenorYears, 1 / 365);
    const price = 100 / (1 + y / 100) ** years;
    return Math.round(price * 10000) / 10000;
  }

  // Near-par when coupon tracks the curve yield.
  const coupon = input.couponRate;
  const durationApprox = Math.min(input.tenorYears, 10);
  const price = 100 + (coupon - y) * durationApprox * 0.8;
  return Math.round(Math.max(50, Math.min(150, price)) * 10000) / 10000;
}
