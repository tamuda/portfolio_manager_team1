/**
 * Treasury API — mirrors backend/app/routes/treasury.py
 */

import { apiFetch } from "@/lib/api/client";
import type {
  TreasuryBuyRequest,
  TreasuryHolding,
  TreasurySellRequest,
  TreasurySellResult,
  TreasuryValuation,
  YieldCurve,
} from "@/types/treasury";

const PATH = "/treasury";

export async function listTreasuries(): Promise<TreasuryHolding[]> {
  return apiFetch<TreasuryHolding[]>(PATH);
}

export async function getTreasuryPerformance(): Promise<TreasuryValuation[]> {
  return apiFetch<TreasuryValuation[]>(`${PATH}/performance`);
}

export async function getYieldCurve(): Promise<YieldCurve> {
  return apiFetch<YieldCurve>(`${PATH}/yield-curve`);
}

export async function buyTreasury(
  input: TreasuryBuyRequest,
): Promise<TreasuryHolding> {
  return apiFetch<TreasuryHolding>(`${PATH}/buy`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function sellTreasury(
  holdingId: number,
  input: TreasurySellRequest,
): Promise<TreasurySellResult> {
  return apiFetch<TreasurySellResult>(`${PATH}/${holdingId}/sell`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
