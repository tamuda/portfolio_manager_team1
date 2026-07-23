"use client";

/**
 * Multi-line chart — market value per holding over time.
 *
 * Preview version uses mock data from lib/mock/holdings-history.ts.
 * Michaela will swap in real API data later.
 */

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  chartPeriodOptions,
  filterSeriesByPeriod,
  getPeriodLabel,
  mockDataCaption,
  mockHoldingsHistory,
  toChartRows,
  type ChartPeriod,
} from "@/lib/mock/holdings-history";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const tickers = mockHoldingsHistory.map((series) => series.ticker);

const chartConfig = {
  AAPL: { label: "AAPL", color: "var(--chart-1)" },
  TSLA: { label: "TSLA", color: "var(--chart-2)" },
  AMZN: { label: "AMZN", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function HoldingsHistoryChart() {
  const [period, setPeriod] = useState<ChartPeriod>("30d");

  const chartData = useMemo(() => {
    const filtered = filterSeriesByPeriod(mockHoldingsHistory, period);
    return toChartRows(filtered);
  }, [period]);

  const showDots = chartData.length <= 2;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Holdings over time</CardTitle>
        <CardDescription>
          Market value per position — {getPeriodLabel(period)} view.{" "}
          <span className="text-muted-foreground">{mockDataCaption}</span>
        </CardDescription>

        <CardAction>
          <div className="flex flex-wrap gap-1">
            {chartPeriodOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={period === option.value ? "default" : "outline"}
                size="sm"
                className={cn("min-w-11 px-2.5")}
                onClick={() => setPeriod(option.value)}
                aria-pressed={period === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No data for this time range.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[320px] w-full"
          >
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={period === "1d" ? 8 : 32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={72}
                tickFormatter={(value: number) =>
                  `$${(value / 1000).toFixed(1)}k`
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />

              {tickers.map((ticker) => (
                <Line
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  stroke={`var(--color-${ticker})`}
                  strokeWidth={2}
                  dot={showDots}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
