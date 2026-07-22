import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getHoldings } from "@/lib/api/holdings";
import { formatCurrency, computeCostBasis } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Dashboard — high-level portfolio overview.
 * Fetches holdings server-side and shows a simple summary card.
 */
export default async function Home() {
  let holdingCount = 0;
  let totalCostBasis = 0;
  let apiAvailable = true;

  try {
    const holdings = await getHoldings();
    holdingCount = holdings.length;
    totalCostBasis = holdings.reduce(
      (sum, h) => sum + computeCostBasis(h.quantity, h.purchase_price),
      0,
    );
  } catch {
    apiAvailable = false;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to Portfolio Manager.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="rounded-xl border p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-muted-foreground">Quick action</p>
          <Link
            href="/portfolios"
            className={cn(buttonVariants(), "mt-3")}
          >
            Manage holdings
          </Link>
        </div>
      </div>
    </div>
  );
}
