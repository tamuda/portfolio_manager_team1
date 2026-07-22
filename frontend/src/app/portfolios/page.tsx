import { AddHoldingDialog } from "@/components/holdings/add-holding-dialog";
import { HoldingsEmptyState } from "@/components/holdings/holdings-empty-state";
import { HoldingsErrorState } from "@/components/holdings/holdings-error-state";
import { HoldingsTable } from "@/components/holdings/holdings-table";
import { ApiError } from "@/lib/api/client";
import { getHoldings } from "@/lib/api/holdings";
import type { Holding } from "@/types/holding";

/**
 * Portfolios page — Server Component.
 *
 * Data flow:
 *   1. Page fetches holdings on the server (getHoldings)
 *   2. Passes the list to HoldingsTable (read-only)
 *   3. Add/Delete buttons call Server Actions → API → revalidatePath
 */
export default async function PortfoliosPage() {
  let holdings: Holding[] = [];
  let errorMessage: string | null = null;

  try {
    holdings = await getHoldings();
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

        {/* Hide add button when the API is down — nothing to save to */}
        {!errorMessage && <AddHoldingDialog />}
      </div>

      {errorMessage && <HoldingsErrorState message={errorMessage} />}

      {!errorMessage && holdings.length === 0 && <HoldingsEmptyState />}

      {!errorMessage && holdings.length > 0 && (
        <HoldingsTable holdings={holdings} />
      )}
    </div>
  );
}
