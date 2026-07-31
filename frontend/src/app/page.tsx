import Link from "next/link";

import { BenchmarkComparison } from "@/components/dashboard/benchmark-comparison";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { MorningSummaryDialog } from "@/components/dashboard/morning-summary-dialog";
import { PortfolioOverviewCharts } from "@/components/dashboard/portfolio-overview-charts";
import { ShareSnapshotDialog } from "@/components/dashboard/share-snapshot-dialog";
import { TrendSignal } from "@/components/dashboard/trend-signal";
import { WatchlistPreview } from "@/components/dashboard/watchlist-preview";
import { HoldingsErrorState } from "@/components/holdings/holdings-error-state";
import { DashboardAlertMonitor } from "@/components/watchlist/dashboard-alert-monitor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getHoldingsPerformance } from "@/lib/api/holdings";
import { getQuote } from "@/lib/api/market-data";
import { getCombinedPortfolioSummary } from "@/lib/api/portfolio";
import { listTreasuries } from "@/lib/api/treasury";
import { getWatchlist } from "@/lib/api/watchlist";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SnapshotWatchlistRow } from "@/components/dashboard/portfolio-postcard";
import type { HoldingPerformance } from "@/types/holding";
import type { CombinedPortfolioSummary } from "@/types/portfolio";

/**
 * Dashboard — high-level portfolio overview across stocks and Treasuries.
 */
export default async function Home() {
  let summary: CombinedPortfolioSummary | null = null;
  let performance: HoldingPerformance[] | null = null;
  let treasuryCount = 0;
  let snapshotWatchlist: SnapshotWatchlistRow[] = [];
  let errorMessage: string | null = null;
  let priceWarning: string | null = null;

  try {
    summary = await getCombinedPortfolioSummary();
    treasuryCount = summary.treasuries.count;

    if (summary.stocks.count > 0) {
      try {
        performance = await getHoldingsPerformance();
      } catch (error) {
        priceWarning =
          error instanceof ApiError
            ? error.message
            : "Live stock prices are temporarily unavailable.";
      }
    }

    // Keep treasury count accurate even if summary used cost-only fallback
    // after a partial failure path (list is cheap).
    try {
      const lots = await listTreasuries();
      treasuryCount = lots.length;
    } catch {
      // ignore — summary count is enough
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

  const stockCount = summary?.stocks.count ?? 0;
  const holdingCount = stockCount + treasuryCount;
  const cashBalance = summary ? parseFloat(summary.cash_balance) : null;
  const totalCostBasis = summary ? parseFloat(summary.total_cost_basis) : 0;
  const totalMarketValue = summary
    ? parseFloat(summary.total_market_value)
    : null;
  const totalGainLoss = summary ? parseFloat(summary.total_gain_loss) : null;
  const portfolioReturn = summary
    ? parseFloat(summary.portfolio_return_percentage)
    : null;
  const stocksMarketValue = summary
    ? parseFloat(summary.stocks.total_market_value)
    : 0;
  const treasuriesMarketValue = summary
    ? parseFloat(summary.treasuries.total_market_value)
    : 0;

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
                portfolioReturn={
                  summary ? parseFloat(summary.stocks.portfolio_return_percentage) : portfolioReturn
                }
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
            {isEmpty ? "Deposit & buy assets" : "Manage holdings"}
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
            <p className="mt-1 text-xs text-muted-foreground">
              {stockCount} stocks · {treasuryCount} Treasuries
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
            {summary && totalMarketValue !== null && totalMarketValue > 0 && (
              <>
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
                  {stocksMarketValue > 0 && (
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${(stocksMarketValue / totalMarketValue) * 100}%`,
                      }}
                      title={`Stocks ${formatCurrency(stocksMarketValue)}`}
                    />
                  )}
                  {treasuriesMarketValue > 0 && (
                    <div
                      className="bg-teal-500"
                      style={{
                        width: `${(treasuriesMarketValue / totalMarketValue) * 100}%`,
                      }}
                      title={`Treasuries ${formatCurrency(treasuriesMarketValue)}`}
                    />
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="text-blue-600">Stocks</span>{" "}
                  {formatCurrency(stocksMarketValue)}
                  {" · "}
                  <span className="text-teal-600">Treasuries</span>{" "}
                  {formatCurrency(treasuriesMarketValue)}
                </p>
              </>
            )}
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
