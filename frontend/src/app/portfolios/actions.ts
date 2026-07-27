"use server";

/**
 * Server Actions for portfolio mutations and trading.
 *
 * Client components call these instead of hitting the API directly.
 * After each mutation we revalidate dashboard + portfolios pages.
 */

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/api/client";
import { deleteHolding } from "@/lib/api/holdings";
import { getLatestPrice } from "@/lib/api/market-data";
import {
  buyStock,
  sellStock,
  transferCash,
} from "@/lib/api/transactions";
import type {
  BuyRequest,
  SellRequest,
  TransferRequest,
} from "@/types/transaction";

type ActionResult = {
  success: boolean;
  error?: string;
};

type PriceActionResult = {
  success: boolean;
  price?: string;
  error?: string;
};

function revalidatePortfolioPaths() {
  revalidatePath("/portfolios");
  revalidatePath("/");
}

/** Look up the latest closing price for a ticker (suggests a trade price). */
export async function getLatestPriceAction(
  ticker: string,
): Promise<PriceActionResult> {
  try {
    const { price } = await getLatestPrice(ticker);
    return { success: true, price };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while fetching the latest price.";

    return { success: false, error: message };
  }
}

/** Buy shares (requires sufficient cash). */
export async function buyStockAction(input: BuyRequest): Promise<ActionResult> {
  try {
    await buyStock({
      ...input,
      ticker: input.ticker.trim().toUpperCase(),
    });
    revalidatePortfolioPaths();
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while placing the buy.";

    return { success: false, error: message };
  }
}

/** Sell shares (requires sufficient holdings). */
export async function sellStockAction(
  input: SellRequest,
): Promise<ActionResult> {
  try {
    await sellStock({
      ...input,
      ticker: input.ticker.trim().toUpperCase(),
    });
    revalidatePortfolioPaths();
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while placing the sell.";

    return { success: false, error: message };
  }
}

/** Deposit or withdraw cash. */
export async function transferCashAction(
  input: TransferRequest,
): Promise<ActionResult> {
  try {
    await transferCash(input);
    revalidatePortfolioPaths();
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while updating cash.";

    return { success: false, error: message };
  }
}

/**
 * @deprecated Prefer buyStockAction — POST /holdings bypasses cash.
 * Kept for emergency/debug use only.
 */
export async function deleteHoldingAction(id: number): Promise<ActionResult> {
  try {
    await deleteHolding(id);
    revalidatePortfolioPaths();
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while deleting the holding.";

    return { success: false, error: message };
  }
}
