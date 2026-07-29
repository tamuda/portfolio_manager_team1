"use server";

/**
 * Server Actions for the Watchlist view.
 *
 * Client components (sidebar rows, tab bar, add-symbol dialog, the detail
 * chart) call these instead of hitting the API directly, mirroring the
 * Server Action pattern already used in app/portfolios/actions.ts.
 */

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/api/client";
import { getQuote, searchSymbols } from "@/lib/api/market-data";
import {
  addWatchlistItem,
  deleteWatchlistItem,
  reorderWatchlist,
} from "@/lib/api/watchlist";
import type { TimeRange } from "@/types/market-data";
import type { Quote, SymbolSuggestion } from "@/types/market-data";
import type { WatchlistItem } from "@/types/watchlist";

type ActionResult = {
  success: boolean;
  error?: string;
};

type QuoteActionResult = ActionResult & {
  quote?: Quote;
};

type WatchlistItemActionResult = ActionResult & {
  item?: WatchlistItem;
};

type SymbolSearchActionResult = ActionResult & {
  results?: SymbolSuggestion[];
};

/** Fetch a quote for the detail pane / sidebar sparkline. */
export async function getQuoteAction(
  ticker: string,
  range: TimeRange,
): Promise<QuoteActionResult> {
  try {
    const quote = await getQuote(ticker, range);
    return { success: true, quote };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while fetching market data.";

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

/** Add a symbol to the watchlist and refresh the page. */
export async function addWatchlistItemAction(
  ticker: string,
): Promise<WatchlistItemActionResult> {
  try {
    const item = await addWatchlistItem({ ticker });
    revalidatePath("/watchlist");
    return { success: true, item };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while adding the symbol.";

    return { success: false, error: message };
  }
}

/** Remove a symbol from the watchlist and refresh the page. */
export async function removeWatchlistItemAction(
  id: number,
): Promise<ActionResult> {
  try {
    await deleteWatchlistItem(id);
    revalidatePath("/watchlist");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while removing the symbol.";

    return { success: false, error: message };
  }
}

/** Persist a new symbol order after a drag-to-reorder. */
export async function reorderWatchlistAction(
  orderedIds: number[],
): Promise<ActionResult> {
  try {
    await reorderWatchlist(orderedIds);
    revalidatePath("/watchlist");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while saving the new order.";

    return { success: false, error: message };
  }
}
