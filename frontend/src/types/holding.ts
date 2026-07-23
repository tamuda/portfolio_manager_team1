/**
 * TypeScript types that mirror the backend Pydantic schemas.
 *
 * Keep these in sync with:
 *   backend/app/schemas/holding.py
 */

/** Payload sent to POST /api/v1/holdings */
export type HoldingCreate = {
  ticker: string;
  quantity_added: string;
  purchase_price: string;
  purchase_date: string;
};

/** Partial payload for PATCH /api/v1/holdings/:id */
export type HoldingUpdate = {
  ticker?: string;
  quantity_added?: string;
  purchase_price?: string;
  purchase_date?: string;
};

/** Single holding returned by the API (includes server-assigned id). */
export type Holding = {
  id: number;
  ticker: string;
  quantity_added: string;
  purchase_price: string;
  purchase_date: string | null;
};

/** Holding with live price and performance metrics from GET /holdings/performance */
export type HoldingPerformance = Holding & {
  current_price: string;
  cost_basis: string;
  market_value: string;
  gain_loss: string;
  gain_loss_percentage: string | null;
};

/** Reserved for a future portfolio summary endpoint. */
export type PortfolioSummary = {
  total_cost_basis: string;
  total_market_value: string;
  total_gain_loss: string;
  portfolio_return_percentage: string;
};
