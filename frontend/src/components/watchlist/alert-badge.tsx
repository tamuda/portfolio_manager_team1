"use client";

import { useAlertRules } from "@/hooks/use-watchlist-alerts";
import { cn } from "@/lib/utils";

type AlertBadgeProps = {
  ticker: string;
  className?: string;
};

/** Small badge when a local alert exists / has triggered for a ticker. */
export function AlertBadge({ ticker, className }: AlertBadgeProps) {
  const alerts = useAlertRules();
  const tickerAlerts = alerts.filter((alert) => alert.ticker === ticker);
  if (tickerAlerts.length === 0) return null;

  const isTriggered = tickerAlerts.some((alert) => Boolean(alert.triggeredAt));

  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        isTriggered
          ? "bg-amber-500/15 text-amber-700"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {isTriggered ? "Alert" : "Watch"}
    </span>
  );
}
