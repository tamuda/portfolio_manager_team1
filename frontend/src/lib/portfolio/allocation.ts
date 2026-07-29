/**
 * Aggregate holdings performance rows by ticker for charts / postcard.
 */

import type { HoldingPerformance } from "@/types/holding";

/** Distinct hues so pie slices / bars stay easy to tell apart. */
export const ALLOCATION_COLORS = [
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#22c55e", // green
  "#f97316", // orange
  "#06b6d4", // cyan
  "#eab308", // gold
  "#ef4444", // red
  "#0ea5e9", // sky
  "#84cc16", // lime
];

export type TickerAllocation = {
  ticker: string;
  market_value: number;
  gain_loss: number;
  share: number;
  fill: string;
};

/** Combine all lots of the same ticker into one row. */
export function aggregateByTicker(
  holdings: HoldingPerformance[],
): TickerAllocation[] {
  const totals = new Map<string, { market_value: number; gain_loss: number }>();

  for (const holding of holdings) {
    const current = totals.get(holding.ticker) ?? {
      market_value: 0,
      gain_loss: 0,
    };
    totals.set(holding.ticker, {
      market_value: current.market_value + parseFloat(holding.market_value),
      gain_loss: current.gain_loss + parseFloat(holding.gain_loss),
    });
  }

  const portfolioMarketValue = [...totals.values()].reduce(
    (sum, entry) => sum + entry.market_value,
    0,
  );

  return [...totals.entries()]
    .sort(([tickerA], [tickerB]) => tickerA.localeCompare(tickerB))
    .map(([ticker, entry], index) => ({
      ticker,
      market_value: entry.market_value,
      gain_loss: entry.gain_loss,
      share:
        portfolioMarketValue > 0
          ? (entry.market_value / portfolioMarketValue) * 100
          : 0,
      fill: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    }));
}
