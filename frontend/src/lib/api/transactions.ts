/**
 * Transactions API — mirrors backend/app/routes/transactions.py
 *
 *   GET  /transactions           → ledger
 *   POST /transactions/buy       → buy shares (deducts cash, adds lot)
 *   POST /transactions/sell      → sell shares (credits cash, reduces lots)
 *   POST /transactions/transfer  → deposit / withdraw cash
 */

import { apiFetch } from "@/lib/api/client";
import type {
  BuyRequest,
  SellRequest,
  Transaction,
  TransferRequest,
} from "@/types/transaction";

const PATH = "/transactions";

export async function listTransactions(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>(PATH);
}

export async function buyStock(input: BuyRequest): Promise<Transaction> {
  return apiFetch<Transaction>(`${PATH}/buy`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function sellStock(input: SellRequest): Promise<Transaction> {
  return apiFetch<Transaction>(`${PATH}/sell`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function transferCash(
  input: TransferRequest,
): Promise<Transaction> {
  return apiFetch<Transaction>(`${PATH}/transfer`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
