"use client";

import { useMemo } from "react";

import { AlertToasts } from "@/components/watchlist/alert-toasts";
import {
  useAlertRules,
  useWatchlistAlerts,
} from "@/hooks/use-watchlist-alerts";

/** Polls all saved alert tickers while the dashboard is open. */
export function DashboardAlertMonitor() {
  const alerts = useAlertRules();
  const tickers = useMemo(
    () => [...new Set(alerts.map((alert) => alert.ticker))],
    [alerts],
  );
  const { toasts, dismissToast } = useWatchlistAlerts(tickers);

  return <AlertToasts toasts={toasts} onDismiss={dismissToast} />;
}
