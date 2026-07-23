import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { PortfolioOverviewCharts } from "@/components/dashboard/portfolio-overview-charts";
import { buttonVariants } from "@/components/ui/button";
import { getHoldings, getHoldingsPerformance } from "@/lib/api/holdings";
import { computeCostBasis, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HoldingPerformance } from "@/types/holding";

/**
 * Dashboard — high-level portfolio overview.
 * Uses performance data when available; falls back to cost basis only.
 */
export default async function Home() {
  let holdingCount = 0;
  let totalCostBasis = 0;
  let totalMarketValue: number | null = null;
  let totalGainLoss: number | null = null;
  let performance: HoldingPerformance[] | null = null;
  let apiAvailable = true;

  try {
    const holdings = await getHoldings();
    holdingCount = holdings.length;
    totalCostBasis = holdings.reduce(
      (sum, h) => sum + computeCostBasis(h.quantity_added, h.purchase_price),
      0,
    );

    if (holdings.length > 0) {
      try {
        const performanceData = await getHoldingsPerformance();
        performance = performanceData;
        totalMarketValue = performanceData.reduce(
          (sum, h) => sum + parseFloat(h.market_value),
          0,
        );
        totalGainLoss = performanceData.reduce(
          (sum, h) => sum + parseFloat(h.gain_loss),
          0,
        );
      } catch {
        // Performance unavailable — dashboard shows cost basis only.
      }
    }
  } catch {
    apiAvailable = false;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to Portfolio Manager.
      </p>

      <div className="mt-6">
        <Link href="/portfolios" className={cn(buttonVariants())}>
          Manage holdings
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Holdings</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {apiAvailable ? holdingCount : "—"}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Total cost basis</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {apiAvailable ? formatCurrency(totalCostBasis) : "—"}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Market value</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {apiAvailable && totalMarketValue !== null
              ? formatCurrency(totalMarketValue)
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Total gain / loss</p>
          <p
            className={cn(
              "mt-1 flex items-center gap-1.5 text-3xl font-semibold tabular-nums",
              totalGainLoss !== null &&
                (totalGainLoss >= 0 ? "text-emerald-600" : "text-red-600"),
            )}
          >
            {apiAvailable && totalGainLoss !== null && totalGainLoss > 0 && (
              <ArrowUpIcon className="size-7 shrink-0" aria-hidden />
            )}
            {apiAvailable && totalGainLoss !== null && totalGainLoss < 0 && (
              <ArrowDownIcon className="size-7 shrink-0" aria-hidden />
            )}
            {apiAvailable && totalGainLoss !== null
              ? formatCurrency(Math.abs(totalGainLoss))
              : "—"}
          </p>
        </div>
      </div>

      {performance && performance.length > 0 && (
        <PortfolioOverviewCharts holdings={performance} />
      )}
    </div>
  );
}
