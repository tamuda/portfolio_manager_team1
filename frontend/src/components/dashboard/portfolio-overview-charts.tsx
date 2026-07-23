"use client";

/**
 * Dashboard charts driven by live GET /holdings/performance data.
 * Aggregated by ticker — multiple lots of AAPL count as one slice/bar.
 */

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { HoldingPerformance } from "@/types/holding";

const ALLOCATION_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type PortfolioOverviewChartsProps = {
  holdings: HoldingPerformance[];
};

type TickerSummary = {
  ticker: string;
  market_value: number;
  gain_loss: number;
  share: number;
  fill: string;
};

/** Combine all lots of the same ticker into one row for dashboard charts. */
function aggregateByTicker(holdings: HoldingPerformance[]): TickerSummary[] {
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

function buildAllocationConfig(rows: TickerSummary[]): ChartConfig {
  return Object.fromEntries(
    rows.map((row) => [
      row.ticker,
      {
        label: row.ticker,
        color: row.fill,
      },
    ]),
  );
}

export function PortfolioOverviewCharts({
  holdings,
}: PortfolioOverviewChartsProps) {
  const byTicker = aggregateByTicker(holdings);
  const gainLossData = [...byTicker].sort((a, b) => b.gain_loss - a.gain_loss);
  const allocationConfig = buildAllocationConfig(byTicker);

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Allocation</CardTitle>
          <CardDescription>
            Share of portfolio by ticker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={allocationConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => {
                      const payload = item.payload as TickerSummary;
                      return (
                        <span className="font-medium tabular-nums">
                          {payload.ticker}: {formatCurrency(Number(value))} (
                          {payload.share.toFixed(1)}%)
                        </span>
                      );
                    }}
                  />
                }
              />
              <Pie
                data={byTicker}
                dataKey="market_value"
                nameKey="ticker"
                innerRadius={56}
                strokeWidth={2}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gain / loss by ticker</CardTitle>
          <CardDescription>
            Unrealized P/L per ticker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              gain: { label: "Gain", color: "hsl(142, 76%, 36%)" },
              loss: { label: "Loss", color: "hsl(0, 72%, 51%)" },
            }}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={gainLossData}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                }
              />
              <YAxis
                type="category"
                dataKey="ticker"
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Bar dataKey="gain_loss" radius={[0, 4, 4, 0]}>
                {gainLossData.map((entry) => (
                  <Cell
                    key={entry.ticker}
                    fill={
                      entry.gain_loss >= 0
                        ? "var(--color-gain)"
                        : "var(--color-loss)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
