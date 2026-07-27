/**
 * Account API — mirrors backend/app/routes/account.py
 *
 *   GET /account → cash balance for the single brokerage account
 */

import { apiFetch } from "@/lib/api/client";
import type { Account } from "@/types/transaction";

/** Fetch the brokerage account (cash starts at 0 until a deposit). */
export async function getAccount(): Promise<Account> {
  return apiFetch<Account>("/account");
}
