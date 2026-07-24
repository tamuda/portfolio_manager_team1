import { formatChangePercent, getChangeTextColor } from "@/lib/change-color";
import { cn } from "@/lib/utils";
import type { Quote } from "@/types/market-data";

type WatchlistHeaderProps = {
  ticker: string;
  quote: Quote | null;
};

export function WatchlistHeader({ ticker, quote }: WatchlistHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4">
      <div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{ticker}</h1>
          {quote?.name && (
            <span className="text-lg text-muted-foreground">{quote.name}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {quote
            ? [quote.exchange, quote.currency].filter(Boolean).join(" · ") || " "
            : " "}
        </p>
      </div>

      <div className="text-right">
        <p className="text-2xl font-bold tabular-nums">
          {quote ? quote.price.toFixed(2) : "—"}
        </p>
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            quote ? getChangeTextColor(quote.change) : "text-muted-foreground",
          )}
        >
          {quote
            ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${formatChangePercent(quote.change_percent)})`
            : "—"}
        </p>
      </div>
    </div>
  );
}
