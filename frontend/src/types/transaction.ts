/**
 * Types mirroring backend/app/schemas/transaction.py
 */

export type TransactionType =
  | "BUY"
  | "SELL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export type TransferDirection = "DEPOSIT" | "WITHDRAWAL";

/** POST /transactions/buy */
export type BuyRequest = {
  ticker: string;
  quantity: string;
  price: string;
  trade_date?: string | null;
};

/** POST /transactions/sell */
export type SellRequest = {
  ticker: string;
  quantity: string;
  price: string;
};

/** POST /transactions/transfer */
export type TransferRequest = {
  direction: TransferDirection;
  amount: string;
};

/** GET /transactions item */
export type Transaction = {
  id: number;
  type: TransactionType;
  ticker: string | null;
  quantity: string | null;
  price: string | null;
  amount: string;
  realized_gain_loss: string | null;
  cash_balance_after: string;
  executed_at: string;
};

/** GET /account */
export type Account = {
  id: number;
  cash_balance: string;
};
