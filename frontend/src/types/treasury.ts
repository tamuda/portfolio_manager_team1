/**
 * Types mirroring backend/app/schemas/treasury.py
 */

export type TreasuryType = "BILL" | "NOTE" | "BOND";

/** Payload for POST /treasury/buy */
export type TreasuryBuyRequest = {
  treasury_type: TreasuryType;
  face_value: string;
  coupon_rate: string;
  coupon_frequency: number;
  maturity_date: string;
  purchase_price: string;
  purchase_date?: string | null;
};

/** Payload for POST /treasury/:id/sell */
export type TreasurySellRequest = {
  sale_price: string;
};

export type TreasuryHolding = {
  id: number;
  treasury_type: TreasuryType;
  face_value: string;
  coupon_rate: string;
  coupon_frequency: number;
  maturity_date: string;
  purchase_date: string;
  purchase_price: string;
};

export type TreasuryValuation = TreasuryHolding & {
  current_price: string;
  cost_basis: string;
  market_value: string;
  gain_loss: string;
  gain_loss_percentage: string;
};

export type YieldCurvePoint = {
  tenor_years: number;
  yield_percent: string;
};

export type YieldCurve = {
  as_of: string | null;
  points: YieldCurvePoint[];
};

export type TreasurySellResult = {
  holding_id: number;
  ticker: string;
  proceeds: string;
  cost_basis: string;
  realized_gain_loss: string;
  cash_balance_after: string;
};

/** Light multi-asset seam for dashboard allocation. */
export type AssetClassId = "stock" | "treasury";
