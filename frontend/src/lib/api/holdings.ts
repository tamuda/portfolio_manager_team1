/**
 * Holdings API — mirrors backend/app/routes/holdings.py
 *
 * Endpoints:
 *   GET    /holdings                 → list all holdings
 *   POST   /holdings                 → create a holding
 *   GET    /holdings/performance     → list holdings with live prices & P/L
 *   GET    /holdings/:id             → get one holding
 *   PATCH  /holdings/:id             → update a holding (Michaela's task)
 *   DELETE /holdings/:id             → remove a holding
 */

import { apiFetch } from "@/lib/api/client";
import type {
  Holding,
  HoldingCreate,
  HoldingPerformance,
} from "@/types/holding";

const HOLDINGS_PATH = "/holdings";

/** Fetch every holding in the portfolio. Used by the Portfolios page. */
export async function getHoldings(): Promise<Holding[]> {
  return apiFetch<Holding[]>(HOLDINGS_PATH);
}

/**
 * Fetch holdings with live prices and performance metrics (yfinance on backend).
 * Returns 503 if a ticker's price cannot be fetched.
 */
export async function getHoldingsPerformance(): Promise<HoldingPerformance[]> {
  return apiFetch<HoldingPerformance[]>(`${HOLDINGS_PATH}/performance`);
}

/** Create a new holding. Returns the saved record (with id). */
export async function createHolding(input: HoldingCreate): Promise<Holding> {
  return apiFetch<Holding>(HOLDINGS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Fetch a single holding by id. */
export async function getHolding(id: number): Promise<Holding> {
  return apiFetch<Holding>(`${HOLDINGS_PATH}/${id}`);
}

// TODO (Michaela): add updateHolding() here — see docs/MICHAELA_DEV_TASK_EDIT_HOLDING.md

/** Permanently remove a holding from the portfolio. */
export async function deleteHolding(id: number): Promise<void> {
  await apiFetch<void>(`${HOLDINGS_PATH}/${id}`, {
    method: "DELETE",
  });
}
