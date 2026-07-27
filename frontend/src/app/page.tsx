import Link from "next/link";

import { BenchmarkComparison } from "@/components/dashboard/benchmark-comparison";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { MorningSummaryDialog } from "@/components/dashboard/morning-summary-dialog";
import { PortfolioOverviewCharts } from "@/components/dashboard/portfolio-overview-charts";
import { ShareSnapshotDialog } from "@/components/dashboard/share-snapshot-dialog";
import { TrendSignal } from "@/components/dashboard/trend-signal";
import { WatchlistPreview } from "@/components/dashboard/watchlist-preview";
import { DashboardAlertMonitor } from "@/components/watchlist/dashboard-alert-monitor";
import { HoldingsErrorState } from "@/components/holdings/holdings-error-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getAccount } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import {
  getHoldings,
  getHoldingsPerformance,
  getPortfolioSummary,
} from "@/lib/api/holdings";
import { getQuote } from "@/lib/api/market-data";
import { getWatchlist } from "@/lib/api/watchlist";
import {
  computeCostBasis,
  formatCurrency,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SnapshotWatchlistRow } from "@/components/dashboard/portfolio-postcard";
import type { HoldingPerformance } from "@/types/holding";

/**
 * Dashboard — high-level portfolio overview.
 * Uses performance + summary when available; falls back to cost basis only.
 * Cash starts at $0 until a deposit via Portfolios.
 */
export default async function Home() {
  let holdingCount = 0;
  let totalCostBasis = 0;
  let totalMarketValue: number | null = null;
  let totalGainLoss: number | null = null;
  let portfolioReturn: number | null = null;
  let cashBalance: number | null = null;
  let performance: HoldingPerformance[] | null = null;
  let snapshotWatchlist: SnapshotWatchlistRow[] = [];
  let errorMessage: string | null = null;
  let priceWarning: string | null = null;

  try {
    const [holdings, account] = await Promise.all([
      getHoldings(),
      getAccount(),
    ]);
    holdingCount = holdings.length;
    cashBalance = parseFloat(account.cash_balance);
    totalCostBasis = holdings.reduce(
      (sum, h) => sum + computeCostBasis(h.quantity_added, h.purchase_price),
      0,
    );

    if (holdings.length > 0) {
      try {
        const [performanceData, summary] = await Promise.all([
          getHoldingsPerformance(),
          getPortfolioSummary(),
        ]);
        performance = performanceData;
        totalCostBasis = parseFloat(summary.total_cost_basis);
        totalMarketValue = parseFloat(summary.total_market_value);
        totalGainLoss = parseFloat(summary.total_gain_loss);
        portfolioReturn = parseFloat(summary.portfolio_return_percentage);
      } catch (error) {
        priceWarning =
          error instanceof ApiError
            ? error.message
            : "Live prices are temporarily unavailable. Showing cost basis only.";
      }
    }

    try {
      const watchlistItems = await getWatchlist();
      const preview = watchlistItems.slice(0, 6);
      const quotes = await Promise.allSettled(
        preview.map((item) => getQuote(item.ticker, "1D")),
      );
      snapshotWatchlist = preview.map((item, index) => {
        const quote =
          quotes[index]?.status === "fulfilled" ? quotes[index].value : null;
        return {
          ticker: item.ticker,
          changePercent: quote?.change_percent ?? null,
        };
      });
    } catch {
      snapshotWatchlist = [];
    }
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Could not reach the backend. Is it running on port 8000?";
  }

  const isEmpty = !errorMessage && holdingCount === 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome to Portfolio Manager.
          </p>
        </div>
        {!errorMessage && (
          <div className="flex flex-wrap items-center gap-2">
            {performance && performance.length > 0 && (
              <ShareSnapshotDialog
                holdings={performance}
                portfolioReturn={portfolioReturn}
                watchlist={snapshotWatchlist}
              />
            )}
            <MorningSummaryDialog />
          </div>
        )}
      </div>

      {!errorMessage && (
        <div className="mt-6">
          <Link href="/portfolios" className={cn(buttonVariants())}>
            {isEmpty ? "Deposit & buy stocks" : "Manage holdings"}
          </Link>
        </div>
      )}

      {errorMessage && <HoldingsErrorState message={errorMessage} />}

      {!errorMessage && priceWarning && (
        <Alert className="mt-8">
          <AlertTitle>Live prices unavailable</AlertTitle>
          <AlertDescription>{priceWarning}</AlertDescription>
        </Alert>
      )}

      {!errorMessage && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0 overflow-hidden rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Cash</p>
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums sm:text-3xl">
              {cashBalance !== null ? formatCurrency(cashBalance) : "—"}
            </p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Holdings</p>
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums sm:text-3xl">
              {holdingCount}
            </p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Total cost basis</p>
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums sm:text-3xl">
              {formatCurrency(totalCostBasis)}
            </p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Market value</p>
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums sm:text-3xl">
              {totalMarketValue !== null
                ? formatCurrency(totalMarketValue)
                : "—"}
            </p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Total gain / loss</p>
            <div
              className={cn(
                "mt-1 flex min-w-0 items-center gap-1.5 text-2xl font-semibold tabular-nums sm:text-3xl",
                totalGainLoss !== null &&
                  (totalGainLoss >= 0 ? "text-emerald-600" : "text-red-600"),
              )}
            >
              {totalGainLoss !== null && (
                <TrendSignal
                  value={totalGainLoss}
                  size="sm"
                  className="shrink-0"
                />
              )}
              <span className="min-w-0 truncate">
                {totalGainLoss !== null
                  ? formatCurrency(Math.abs(totalGainLoss))
                  : "—"}
              </span>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">Portfolio return</p>
            <div
              className={cn(
                "mt-1 flex min-w-0 items-center gap-1.5 text-2xl font-semibold tabular-nums sm:text-3xl",
                portfolioReturn !== null &&
                  (portfolioReturn >= 0
                    ? "text-emerald-600"
                    : "text-red-600"),
              )}
            >
              {portfolioReturn !== null && (
                <TrendSignal
                  value={portfolioReturn}
                  size="sm"
                  className="shrink-0"
                />
              )}
              <span className="min-w-0 truncate">
                {portfolioReturn !== null
                  ? formatPercent(portfolioReturn)
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {isEmpty && <DashboardEmptyState />}

      {!errorMessage && !isEmpty && performance && performance.length > 0 && (
        <>
          <BenchmarkComparison holdings={performance} />
          <PortfolioOverviewCharts holdings={performance} />
        </>
      )}

      {!errorMessage && <WatchlistPreview />}
      {!errorMessage && <DashboardAlertMonitor />}
    </div>
  );
}
