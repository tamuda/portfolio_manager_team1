/**
 * Browser-local watchlist alert rules (no backend / no auth).
 */

import { z } from "zod";

const STORAGE_KEY = "watchlist-alerts";
const NOTIFY_KEY = "watchlist-alerts-browser-notify";

export const ALERT_TYPES = [
  "price_above",
  "price_below",
  "pct_move",
] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

export const watchlistAlertSchema = z.object({
  id: z.string(),
  ticker: z.string().min(1),
  type: z.enum(ALERT_TYPES),
  threshold: z.number().finite(),
  createdAt: z.string(),
  triggeredAt: z.string().optional(),
});

export type WatchlistAlert = z.infer<typeof watchlistAlertSchema>;

const alertsListSchema = z.array(watchlistAlertSchema);

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadAlerts(): WatchlistAlert[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = alertsListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: WatchlistAlert[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new CustomEvent("watchlist-alerts-changed"));
}

/** One active rule per ticker+type — replace if present. */
export function upsertAlert(
  input: Omit<WatchlistAlert, "id" | "createdAt" | "triggeredAt"> & {
    id?: string;
  },
): WatchlistAlert {
  const alerts = loadAlerts();
  const ticker = input.ticker.trim().toUpperCase();
  const next: WatchlistAlert = {
    id: input.id ?? crypto.randomUUID(),
    ticker,
    type: input.type,
    threshold: input.threshold,
    createdAt: new Date().toISOString(),
  };

  const filtered = alerts.filter(
    (alert) => !(alert.ticker === ticker && alert.type === input.type),
  );
  filtered.push(next);
  saveAlerts(filtered);
  return next;
}

export function removeAlert(id: string): void {
  saveAlerts(loadAlerts().filter((alert) => alert.id !== id));
}

export function removeAlertsForTicker(ticker: string): void {
  const normalized = ticker.trim().toUpperCase();
  saveAlerts(loadAlerts().filter((alert) => alert.ticker !== normalized));
}

export function markAlertTriggered(id: string): WatchlistAlert | null {
  const alerts = loadAlerts();
  const index = alerts.findIndex((alert) => alert.id === id);
  if (index < 0) return null;
  if (alerts[index].triggeredAt) return alerts[index];

  const updated = {
    ...alerts[index],
    triggeredAt: new Date().toISOString(),
  };
  alerts[index] = updated;
  saveAlerts(alerts);
  return updated;
}

export function clearAlertTrigger(id: string): void {
  const alerts = loadAlerts().map((alert) =>
    alert.id === id ? { ...alert, triggeredAt: undefined } : alert,
  );
  saveAlerts(alerts);
}

export function getAlertsForTicker(ticker: string): WatchlistAlert[] {
  const normalized = ticker.trim().toUpperCase();
  return loadAlerts().filter((alert) => alert.ticker === normalized);
}

export function hasTriggeredAlert(ticker: string): boolean {
  return getAlertsForTicker(ticker).some((alert) => Boolean(alert.triggeredAt));
}

export function getBrowserNotifyEnabled(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(NOTIFY_KEY) === "1";
}

export function setBrowserNotifyEnabled(enabled: boolean): void {
  if (!canUseStorage()) return;
  localStorage.setItem(NOTIFY_KEY, enabled ? "1" : "0");
}

export function alertTypeLabel(type: AlertType): string {
  switch (type) {
    case "price_above":
      return "Price above";
    case "price_below":
      return "Price below";
    case "pct_move":
      return "Daily move ±%";
  }
}

export function formatAlertRule(alert: WatchlistAlert): string {
  switch (alert.type) {
    case "price_above":
      return `${alert.ticker} ≥ $${alert.threshold.toFixed(2)}`;
    case "price_below":
      return `${alert.ticker} ≤ $${alert.threshold.toFixed(2)}`;
    case "pct_move":
      return `${alert.ticker} ±${alert.threshold.toFixed(2)}% today`;
  }
}
