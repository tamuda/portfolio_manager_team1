import Link from "next/link";

import { AlertBadge } from "@/components/watchlist/alert-badge";
import { Sparkline } from "@/components/watchlist/sparkline";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatChangePercent, getChangePillClasses } from "@/lib/change-color";
import { getQuote } from "@/lib/api/market-data";
import { getWatchlist } from "@/lib/api/watchlist";
import { cn } from "@/lib/utils";
import type { Quote } from "@/types/market-data";
import type { WatchlistItem } from "@/types/watchlist";

const PREVIEW_LIMIT = 5;

type PreviewRow = {
  item: WatchlistItem;
  quote: Quote | null;
};

async function loadPreviewRows(): Promise<PreviewRow[]> {
  const items = await getWatchlist();
  const previewItems = items.slice(0, PREVIEW_LIMIT);

  const quotes = await Promise.allSettled(
    previewItems.map((item) => getQuote(item.ticker, "1D")),
  );

  return previewItems.map((item, index) => ({
    item,
    quote: quotes[index]?.status === "fulfilled" ? quotes[index].value : null,
  }));
}

/** Compact watchlist snapshot for the dashboard home page. */
export async function WatchlistPreview() {
  let rows: PreviewRow[] = [];

  try {
    rows = await loadPreviewRows();
  } catch {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Watchlist</CardTitle>
          <CardDescription>Stocks you&apos;re tracking</CardDescription>
        </div>
        <Link href="/watchlist" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          View all
        </Link>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No symbols on your watchlist yet.
            </p>
            <Link href="/watchlist" className={cn(buttonVariants({ size: "sm" }))}>
              Add a symbol
            </Link>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map(({ item, quote }) => (
              <li key={item.id}>
                <Link
                  href="/watchlist"
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {item.ticker}
                      <AlertBadge ticker={item.ticker} />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {quote?.name ?? "—"}
                    </p>
                  </div>

                  {quote && quote.points.length > 1 && (
                    <Sparkline points={quote.points} change={quote.change} />
                  )}

                  <div className="flex w-16 shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums">
                      {quote ? quote.price.toFixed(2) : "—"}
                    </span>
                    {quote && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
                          getChangePillClasses(quote.change),
                        )}
                      >
                        {formatChangePercent(quote.change_percent)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
