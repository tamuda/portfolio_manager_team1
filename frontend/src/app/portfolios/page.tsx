import { BasicHoldingsTable } from "@/components/holdings/basic-holdings-table";
import { CashBalanceStrip } from "@/components/holdings/cash-balance-strip";
import { HoldingsEmptyState } from "@/components/holdings/holdings-empty-state";
import { HoldingsErrorState } from "@/components/holdings/holdings-error-state";
import { HoldingsTable } from "@/components/holdings/holdings-table";
import { TransactionsActivity } from "@/components/holdings/transactions-activity";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAccount } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { getHoldings, getHoldingsPerformance } from "@/lib/api/holdings";
import { listTransactions } from "@/lib/api/transactions";
import type { Holding, HoldingPerformance } from "@/types/holding";
import type { Transaction } from "@/types/transaction";

/**
 * Portfolios page — Server Component.
 *
 * Cash-aware Buy / Sell / Deposit flow against the transactions API.
 * Prefers GET /holdings/performance; falls back to GET /holdings on price errors.
 */
export default async function PortfoliosPage() {
  let holdings: Holding[] = [];
  let performance: HoldingPerformance[] | null = null;
  let cashBalance = 0;
  let transactions: Transaction[] = [];
  let errorMessage: string | null = null;
  let priceWarning: string | null = null;

  try {
    const [account, holdingsData, txs] = await Promise.all([
      getAccount(),
      getHoldings(),
      listTransactions(),
    ]);
    cashBalance = parseFloat(account.cash_balance);
    holdings = holdingsData;
    transactions = txs;

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
            Deposit cash, buy and sell stocks, and review your activity ledger.
          </p>
        </div>
      </div>

      {errorMessage && <HoldingsErrorState message={errorMessage} />}

      {!errorMessage && <CashBalanceStrip cashBalance={cashBalance} />}

      {!errorMessage && priceWarning && (
        <Alert className="mt-8">
          <AlertTitle>Live prices unavailable</AlertTitle>
          <AlertDescription>{priceWarning}</AlertDescription>
        </Alert>
      )}

      {!errorMessage && holdings.length === 0 && (
        <HoldingsEmptyState cashBalance={cashBalance} />
      )}

      {!errorMessage && holdings.length > 0 && performance && (
        <HoldingsTable holdings={performance} />
      )}

      {!errorMessage && holdings.length > 0 && !performance && (
        <BasicHoldingsTable holdings={holdings} />
      )}

      {!errorMessage && <TransactionsActivity transactions={transactions} />}
    </div>
  );
}
