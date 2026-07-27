/**
 * Aggregate holdings performance rows by ticker for charts / postcard.
 */

import type { HoldingPerformance } from "@/types/holding";

export const ALLOCATION_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
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
