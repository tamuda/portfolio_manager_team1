/**
 * TypeScript types that mirror the backend Pydantic schemas.
 *
 * Keep these in sync with:
 *   backend/app/schemas/watchlist.py
 */

/** Payload sent to POST /api/v1/watchlist */
export type WatchlistItemCreate = {
  ticker: string;
};

/** Single watchlist entry returned by the API. */
export type WatchlistItem = {
  id: number;
  ticker: string;
  position: number;
};
