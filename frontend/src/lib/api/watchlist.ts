/**
 * Watchlist API — mirrors backend/app/routes/watchlist.py
 *
 * Endpoints:
 *   GET    /watchlist          → list watched symbols, ordered by position
 *   POST   /watchlist          → add a symbol
 *   PUT    /watchlist/reorder  → persist a new symbol order
 *   DELETE /watchlist/:id      → remove a symbol
 */

import { apiFetch } from "@/lib/api/client";
import type { WatchlistItem, WatchlistItemCreate } from "@/types/watchlist";

const WATCHLIST_PATH = "/watchlist";

/** Fetch every watched symbol, ordered by its saved position. */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>(WATCHLIST_PATH);
}

/** Add a symbol to the watchlist. Returns the saved record (with id). */
export async function addWatchlistItem(
  input: WatchlistItemCreate,
): Promise<WatchlistItem> {
  return apiFetch<WatchlistItem>(WATCHLIST_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Persist a new symbol order after a drag-to-reorder. */
export async function reorderWatchlist(
  orderedIds: number[],
): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>(`${WATCHLIST_PATH}/reorder`, {
    method: "PUT",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

/** Remove a symbol from the watchlist. */
export async function deleteWatchlistItem(id: number): Promise<void> {
  await apiFetch<void>(`${WATCHLIST_PATH}/${id}`, {
    method: "DELETE",
  });
}
