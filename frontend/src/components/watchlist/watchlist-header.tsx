"use client";

import { useState } from "react";
import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SetAlertDialog } from "@/components/watchlist/set-alert-dialog";
import { useAlertRules } from "@/hooks/use-watchlist-alerts";
import { formatChangePercent, getChangeTextColor } from "@/lib/change-color";
import { cn } from "@/lib/utils";
import type { Quote } from "@/types/market-data";

type WatchlistHeaderProps = {
  ticker: string;
  quote: Quote | null;
};

export function WatchlistHeader({ ticker, quote }: WatchlistHeaderProps) {
  const [alertOpen, setAlertOpen] = useState(false);
  const alerts = useAlertRules();
  const tickerAlerts = alerts.filter((alert) => alert.ticker === ticker);
  const isTriggered = tickerAlerts.some((alert) => Boolean(alert.triggeredAt));

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

      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAlertOpen(true)}
          className={cn(isTriggered && "border-amber-500/40 text-amber-700")}
        >
          <BellIcon data-icon="inline-start" />
          {tickerAlerts.length > 0
            ? isTriggered
              ? "Alert triggered"
              : "Edit alert"
            : "Set alert"}
        </Button>

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

      <SetAlertDialog
        ticker={ticker}
        open={alertOpen}
        onOpenChange={setAlertOpen}
        defaultPrice={quote?.price}
      />
    </div>
  );
}
