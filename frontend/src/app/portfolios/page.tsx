import { AddHoldingDialog } from "@/components/holdings/add-holding-dialog";
import { BasicHoldingsTable } from "@/components/holdings/basic-holdings-table";
import { HoldingsEmptyState } from "@/components/holdings/holdings-empty-state";
import { HoldingsErrorState } from "@/components/holdings/holdings-error-state";
import { HoldingsTable } from "@/components/holdings/holdings-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/client";
import { getHoldings, getHoldingsPerformance } from "@/lib/api/holdings";
import type { Holding, HoldingPerformance } from "@/types/holding";

/**
 * Portfolios page — Server Component.
 *
 * Prefers GET /holdings/performance (live prices via yfinance on backend).
 * Falls back to GET /holdings if price data is unavailable.
 */
export default async function PortfoliosPage() {
  let holdings: Holding[] = [];
  let performance: HoldingPerformance[] | null = null;
  let errorMessage: string | null = null;
  let priceWarning: string | null = null;

  try {
    holdings = await getHoldings();

    if (holdings.length > 0) {
      try {
        performance = await getHoldingsPerformance();
      } catch (error) {
        priceWarning =
          error instanceof ApiError
            ? error.message
            : "Live prices are temporarily unavailable. Showing cost basis only.";
      }
    }
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Could not reach the backend. Is it running on port 8000?";
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolios</h1>
          <p className="mt-2 text-muted-foreground">
            Browse, add, and remove holdings in your portfolio.
          </p>
        </div>

        {!errorMessage && <AddHoldingDialog />}
      </div>

      {errorMessage && <HoldingsErrorState message={errorMessage} />}

      {!errorMessage && priceWarning && (
        <Alert className="mt-8">
          <AlertTitle>Live prices unavailable</AlertTitle>
          <AlertDescription>{priceWarning}</AlertDescription>
        </Alert>
      )}

      {!errorMessage && holdings.length === 0 && <HoldingsEmptyState />}

      {!errorMessage && holdings.length > 0 && performance && (
        <HoldingsTable holdings={performance} />
      )}

      {!errorMessage && holdings.length > 0 && !performance && (
        <BasicHoldingsTable holdings={holdings} />
      )}
    </div>
  );
}
