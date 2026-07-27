/**
 * Build a value-weighted portfolio index vs a benchmark series.
 * Both series are normalized to 100 at the first overlapping point.
 */

import type { PricePoint } from "@/types/market-data";

export type HoldingLot = {
  ticker: string;
  quantity: number;
};

export type NormalizedPoint = {
  date: string;
  label: string;
  portfolio: number;
  benchmark: number;
};

export type BenchmarkSeriesResult = {
  points: NormalizedPoint[];
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number;
  missingTickers: string[];
};

function toDayKey(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function formatLabel(dayKey: string): string {
  const date = new Date(`${dayKey}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function pointsToDayMap(points: PricePoint[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const point of points) {
    map.set(toDayKey(point.timestamp), point.close);
  }
  return map;
}

function forwardFill(
  days: string[],
  dayMap: Map<string, number>,
): Map<string, number> {
  const filled = new Map<string, number>();
  let last: number | undefined;

  for (const day of days) {
    const value = dayMap.get(day);
    if (value !== undefined) {
      last = value;
      filled.set(day, value);
    } else if (last !== undefined) {
      filled.set(day, last);
    }
  }

  return filled;
}

function seriesReturn(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  if (first <= 0) return 0;
  return ((last / first) - 1) * 100;
}

/**
 * Aggregate lots by ticker (sum quantities) for weighting.
 */
export function aggregateQuantities(lots: HoldingLot[]): Map<string, number> {
  const byTicker = new Map<string, number>();
  for (const lot of lots) {
    const ticker = lot.ticker.trim().toUpperCase();
    if (!ticker || lot.quantity <= 0) continue;
    byTicker.set(ticker, (byTicker.get(ticker) ?? 0) + lot.quantity);
  }
  return byTicker;
}

/**
 * Build normalized overlay series from holding quotes + a benchmark quote.
 */
export function buildBenchmarkSeries(input: {
  quantities: Map<string, number>;
  holdingPoints: Map<string, PricePoint[]>;
  benchmarkPoints: PricePoint[];
}): BenchmarkSeriesResult {
  const missingTickers: string[] = [];
  const usable = new Map<string, Map<string, number>>();

  for (const [ticker, quantity] of input.quantities) {
    const points = input.holdingPoints.get(ticker);
    if (!points || points.length === 0 || quantity <= 0) {
      missingTickers.push(ticker);
      continue;
    }
    usable.set(ticker, pointsToDayMap(points));
  }

  const benchmarkMap = pointsToDayMap(input.benchmarkPoints);
  if (usable.size === 0 || benchmarkMap.size === 0) {
    return {
      points: [],
      portfolioReturn: 0,
      benchmarkReturn: 0,
      alpha: 0,
      missingTickers,
    };
  }

  const daySet = new Set<string>();
  for (const map of usable.values()) {
    for (const day of map.keys()) daySet.add(day);
  }
  for (const day of benchmarkMap.keys()) daySet.add(day);

  const days = [...daySet].sort();
  const filledHoldings = new Map<string, Map<string, number>>();
  for (const [ticker, map] of usable) {
    filledHoldings.set(ticker, forwardFill(days, map));
  }
  const filledBenchmark = forwardFill(days, benchmarkMap);

  const portfolioRaw: { date: string; value: number }[] = [];
  const benchmarkRaw: number[] = [];

  for (const day of days) {
    const bench = filledBenchmark.get(day);
    if (bench === undefined) continue;

    let portfolioValue = 0;
    let covered = 0;

    for (const [ticker, map] of filledHoldings) {
      const price = map.get(day);
      const qty = input.quantities.get(ticker) ?? 0;
      if (price === undefined || qty <= 0) continue;
      portfolioValue += qty * price;
      covered += 1;
    }

    // Require every usable holding to have a price that day.
    if (covered < filledHoldings.size || portfolioValue <= 0) continue;

    portfolioRaw.push({ date: day, value: portfolioValue });
    benchmarkRaw.push(bench);
  }

  if (portfolioRaw.length < 2) {
    return {
      points: [],
      portfolioReturn: 0,
      benchmarkReturn: 0,
      alpha: 0,
      missingTickers,
    };
  }

  const portfolioBase = portfolioRaw[0].value;
  const benchmarkBase = benchmarkRaw[0];

  const points: NormalizedPoint[] = portfolioRaw.map((entry, index) => ({
    date: entry.date,
    label: formatLabel(entry.date),
    portfolio: (entry.value / portfolioBase) * 100,
    benchmark: (benchmarkRaw[index] / benchmarkBase) * 100,
  }));

  const portfolioReturn = seriesReturn(points.map((p) => p.portfolio));
  const benchmarkReturn = seriesReturn(points.map((p) => p.benchmark));

  return {
    points,
    portfolioReturn,
    benchmarkReturn,
    alpha: portfolioReturn - benchmarkReturn,
    missingTickers,
  };
}
