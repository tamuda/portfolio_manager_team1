"use client";

/**
 * Poll watchlist quotes and evaluate local alert rules while the app is open.
 */

import { useCallback, useEffect, useState } from "react";

import { getQuoteAction } from "@/app/watchlist/actions";
import { usePolling } from "@/hooks/use-polling";
import {
  formatAlertRule,
  getBrowserNotifyEnabled,
  loadAlerts,
  markAlertTriggered,
  type WatchlistAlert,
} from "@/lib/alerts/storage";
import { PRICE_POLL_MS } from "@/lib/live-prices";
import type { Quote } from "@/types/market-data";

export type AlertToast = {
  id: string;
  message: string;
  alertId: string;
};

function isTriggered(alert: WatchlistAlert, quote: Quote): boolean {
  switch (alert.type) {
    case "price_above":
      return quote.price >= alert.threshold;
    case "price_below":
      return quote.price <= alert.threshold;
    case "pct_move": {
      if (quote.change_percent === null) return false;
      return Math.abs(quote.change_percent) >= alert.threshold;
    }
  }
}

function notifyBrowser(message: string) {
  if (!getBrowserNotifyEnabled()) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("Watchlist alert", { body: message });
  } catch {
    // Ignore notification failures (e.g. denied mid-session).
  }
}

export function useWatchlistAlerts(tickers: string[]) {
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [toasts, setToasts] = useState<AlertToast[]>([]);

  const refresh = useCallback(() => {
    setAlerts(loadAlerts());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("watchlist-alerts-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("watchlist-alerts-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const evaluate = useCallback(async () => {
    const current = loadAlerts().filter((alert) => !alert.triggeredAt);
    if (current.length === 0) return;

    const uniqueTickers = [
      ...new Set(current.map((alert) => alert.ticker)),
    ].filter((ticker) => tickers.length === 0 || tickers.includes(ticker));

    for (const ticker of uniqueTickers) {
      const result = await getQuoteAction(ticker, "1D");
      if (!result.success || !result.quote) continue;

      const quote = result.quote;
      const matching = current.filter((alert) => alert.ticker === ticker);

      for (const alert of matching) {
        if (!isTriggered(alert, quote)) continue;
        const updated = markAlertTriggered(alert.id);
        if (!updated) continue;

        const message = `Alert: ${formatAlertRule(updated)} (now $${quote.price.toFixed(2)})`;
        setToasts((prev) => [
          ...prev,
          { id: crypto.randomUUID(), message, alertId: updated.id },
        ]);
        notifyBrowser(message);
      }
    }

    refresh();
  }, [refresh, tickers]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  usePolling(() => {
    void evaluate();
  }, PRICE_POLL_MS);

  return { alerts, toasts, dismissToast, refresh };
}

/** Lightweight subscription for badges without polling. */
export function useAlertRules() {
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);

  useEffect(() => {
    const sync = () => setAlerts(loadAlerts());
    sync();
    window.addEventListener("watchlist-alerts-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("watchlist-alerts-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return alerts;
}
