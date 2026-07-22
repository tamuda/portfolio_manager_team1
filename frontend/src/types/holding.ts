/**
 * TypeScript types that mirror the backend Pydantic schemas.
 *
 * Keep these in sync with:
 *   backend/app/schemas/holding.py
 *
 * When the backend adds or changes a field, update the matching type here
 * so the frontend stays type-safe end-to-end.
 */

/** Payload sent to POST /api/v1/holdings */
export type HoldingCreate = {
  ticker: string;
  quantity: string;
  purchase_price: string;
  purchase_date: string;
};

/** Single holding returned by the API (includes server-assigned id). */
export type Holding = {
  id: number;
  ticker: string;
  quantity: string;
  purchase_price: string;
  purchase_date: string | null;
};

/**
 * Reserved for Sprint 2 when the backend wires up live prices.
 * Defined now so MICHAELA_DEV_TASK_LIVE_PRICE can reference it early.
 */
export type HoldingPerformance = Holding & {
  current_price: string;
  cost_basis: string;
  market_value: string;
  gain_loss: string;
  return_percentage: string | null;
};
