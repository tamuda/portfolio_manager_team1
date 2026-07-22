/**
 * Holdings API — mirrors backend/app/routes/holdings.py
 *
 * Endpoints:
 *   GET    /holdings          → list all holdings
 *   POST   /holdings          → create a holding
 *   GET    /holdings/:id      → get one holding
 *   DELETE /holdings/:id      → remove a holding
 */

import { apiFetch } from "@/lib/api/client";
import type { Holding, HoldingCreate } from "@/types/holding";

const HOLDINGS_PATH = "/holdings";

/** Fetch every holding in the portfolio. Used by the Portfolios page. */
export async function getHoldings(): Promise<Holding[]> {
  return apiFetch<Holding[]>(HOLDINGS_PATH);
}

/** Create a new holding. Returns the saved record (with id). */
export async function createHolding(input: HoldingCreate): Promise<Holding> {
  return apiFetch<Holding>(HOLDINGS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Fetch a single holding by id. Useful for detail pages later. */
export async function getHolding(id: number): Promise<Holding> {
  return apiFetch<Holding>(`${HOLDINGS_PATH}/${id}`);
}

/** Permanently remove a holding from the portfolio. */
export async function deleteHolding(id: number): Promise<void> {
  await apiFetch<void>(`${HOLDINGS_PATH}/${id}`, {
    method: "DELETE",
  });
}
