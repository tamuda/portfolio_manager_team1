/**
 * Snapshot of real market history for the dashboard chart preview.
 *
 * Source: Yahoo Finance via yfinance (fetched Jul 23, 2026).
 * market_value = closing price × quantity (10 AAPL, 5 TSLA, 8 AMZN).
 *
 * TODO: Replace with GET /api/v1/portfolio/holdings-history when available.
 */

import rawData from "@/lib/mock/holdings-history.json";

export type HoldingHistoryPoint = {
  date: string;
  market_value: number;
  close: number;
};

export type HoldingHistorySeries = {
  ticker: string;
  quantity: number;
  points: HoldingHistoryPoint[];
};

/** Time-range filters shown above the chart. */
export type ChartPeriod = "1d" | "7d" | "30d" | "ytd" | "all";

export const chartPeriodOptions: Array<{ value: ChartPeriod; label: string }> = [
  { value: "1d", label: "1D" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "ytd", label: "YTD" },
  { value: "all", label: "All" },
];

export const mockHoldingsHistory = rawData as HoldingHistorySeries[];

export type ChartRow = {
  isoDate: string;
  date: string;
  [ticker: string]: string | number;
};

/** Filter each series to points on or after the period cutoff. */
export function filterSeriesByPeriod(
  series: HoldingHistorySeries[],
  period: ChartPeriod,
): HoldingHistorySeries[] {
  const cutoff = getPeriodCutoff(series, period);
  if (cutoff === null) return series;

  return series.map((entry) => ({
    ...entry,
    points: entry.points.filter((point) => point.date >= cutoff),
  }));
}

/** Merge series into Recharts rows, keeping isoDate for filtering. */
export function toChartRows(series: HoldingHistorySeries[]): ChartRow[] {
  const dates = [
    ...new Set(series.flatMap((s) => s.points.map((p) => p.date))),
  ].sort();

  return dates.map((isoDate) => {
    const row: ChartRow = {
      isoDate,
      date: formatChartDate(isoDate),
    };

    for (const { ticker, points } of series) {
      const point = points.find((p) => p.date === isoDate);
      if (point) row[ticker] = point.market_value;
    }

    return row;
  });
}

function getPeriodCutoff(
  series: HoldingHistorySeries[],
  period: ChartPeriod,
): string | null {
  const latestIso = getLatestDate(series);
  if (!latestIso || period === "all") return null;

  const latest = parseIsoDate(latestIso);

  switch (period) {
    case "1d": {
      // Daily closes only — use the last two trading days so a line renders.
      const tradingDays = [
        ...new Set(series.flatMap((s) => s.points.map((p) => p.date))),
      ].sort();
      return tradingDays.at(-2) ?? latestIso;
    }
    case "7d":
      return toIsoDate(addDays(latest, -7));
    case "30d":
      return toIsoDate(addDays(latest, -30));
    case "ytd":
      return `${latest.getFullYear()}-01-01`;
    default:
      return null;
  }
}

function getLatestDate(series: HoldingHistorySeries[]): string | undefined {
  const dates = series.flatMap((s) => s.points.map((p) => p.date));
  return dates.sort().at(-1);
}

function parseIsoDate(isoDate: string): Date {
  return new Date(isoDate + "T12:00:00");
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatChartDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseIsoDate(isoDate));
}

/** Human-readable note for the chart subtitle. */
export const mockDataCaption =
  "Sample portfolio · real Yahoo Finance closes (Jun 18 – Jul 23, 2026)";

export function getPeriodLabel(period: ChartPeriod): string {
  return chartPeriodOptions.find((option) => option.value === period)?.label ?? "";
}
