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
import { getLatestPrice, searchSymbols } from "@/lib/api/market-data";
import {
  buyTreasury,
  getYieldCurve,
  sellTreasury,
} from "@/lib/api/treasury";
import {
  buyStock,
  sellStock,
  transferCash,
} from "@/lib/api/transactions";
import type { SymbolSuggestion } from "@/types/market-data";
import type {
  TreasuryBuyRequest,
  TreasurySellRequest,
  YieldCurve,
} from "@/types/treasury";
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

type SymbolSearchActionResult = ActionResult & {
  results?: SymbolSuggestion[];
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

/** Suggest tickers/company names matching a partial query as the user types. */
export async function searchSymbolsAction(
  query: string,
): Promise<SymbolSearchActionResult> {
  try {
    const { results } = await searchSymbols(query);
    return { success: true, results };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while searching symbols.";

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

type YieldCurveActionResult = ActionResult & {
  curve?: YieldCurve;
};

/** Fetch the cached FRED Treasury yield curve. */
export async function getYieldCurveAction(): Promise<YieldCurveActionResult> {
  try {
    const curve = await getYieldCurve();
    return { success: true, curve };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Could not load the Treasury yield curve.";

    return { success: false, error: message };
  }
}

/** Buy a US Treasury lot (requires sufficient cash). */
export async function buyTreasuryAction(
  input: TreasuryBuyRequest,
): Promise<ActionResult> {
  try {
    await buyTreasury(input);
    revalidatePortfolioPaths();
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while buying this Treasury.";

    return { success: false, error: message };
  }
}

/** Sell an entire Treasury lot. */
export async function sellTreasuryAction(
  holdingId: number,
  input: TreasurySellRequest,
): Promise<ActionResult> {
  try {
    await sellTreasury(holdingId, input);
    revalidatePortfolioPaths();
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while selling this Treasury.";

    return { success: false, error: message };
  }
}
