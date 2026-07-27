"use client";

/**
 * Value-weighted portfolio vs SPY over a selectable window.
 */

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Loader2Icon } from "lucide-react";

import { getQuoteAction } from "@/app/watchlist/actions";
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
import {
  aggregateQuantities,
  buildBenchmarkSeries,
  type BenchmarkSeriesResult,
} from "@/lib/benchmark/build-series";
import { formatChangePercent } from "@/lib/change-color";
import { cn } from "@/lib/utils";
import type { HoldingPerformance } from "@/types/holding";
import type { PricePoint, TimeRange } from "@/types/market-data";

const BENCHMARK = "SPY";
const RANGES = ["1M", "3M", "YTD", "1Y"] as const;

type BenchmarkRange = (typeof RANGES)[number];

const chartConfig = {
  portfolio: { label: "Portfolio", color: "hsl(221, 83%, 53%)" },
  benchmark: { label: "SPY", color: "hsl(215, 16%, 47%)" },
} satisfies ChartConfig;

type BenchmarkComparisonProps = {
  holdings: HoldingPerformance[];
};

export function BenchmarkComparison({ holdings }: BenchmarkComparisonProps) {
  const [range, setRange] = useState<BenchmarkRange>("3M");
  const [result, setResult] = useState<BenchmarkSeriesResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quantities = useMemo(
    () =>
      aggregateQuantities(
        holdings.map((holding) => ({
          ticker: holding.ticker,
          quantity: parseFloat(holding.quantity_added),
        })),
      ),
    [holdings],
  );

  const tickers = useMemo(() => [...quantities.keys()], [quantities]);

  useEffect(() => {
    if (tickers.length === 0) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      const holdingPoints = new Map<string, PricePoint[]>();
      const settled = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const response = await getQuoteAction(ticker, range as TimeRange);
          if (!response.success || !response.quote) {
            throw new Error(response.error ?? `Failed to load ${ticker}`);
          }
          return { ticker, points: response.quote.points };
        }),
      );

      for (const entry of settled) {
        if (entry.status === "fulfilled") {
          holdingPoints.set(entry.value.ticker, entry.value.points);
        }
      }

      const benchmarkResult = await getQuoteAction(
        BENCHMARK,
        range as TimeRange,
      );

      if (cancelled) return;

      if (!benchmarkResult.success || !benchmarkResult.quote) {
        setError(
          benchmarkResult.error ?? `Could not load ${BENCHMARK} benchmark data.`,
        );
        setResult(null);
        setIsLoading(false);
        return;
      }

      const series = buildBenchmarkSeries({
        quantities,
        holdingPoints,
        benchmarkPoints: benchmarkResult.quote.points,
      });

      if (series.points.length < 2) {
        setError("Not enough overlapping price history to compare.");
        setResult(series);
      } else {
        setError(null);
        setResult(series);
      }
      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [quantities, range, tickers]);

  if (tickers.length === 0) return null;

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Benchmark</CardTitle>
          <CardDescription>
            Value-weighted portfolio vs {BENCHMARK} over {range}
          </CardDescription>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === option
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatBlock
            label="Portfolio"
            value={result && !error ? result.portfolioReturn : null}
            loading={isLoading}
          />
          <StatBlock
            label={BENCHMARK}
            value={result && !error ? result.benchmarkReturn : null}
            loading={isLoading}
          />
          <StatBlock
            label="Alpha"
            value={result && !error ? result.alpha : null}
            loading={isLoading}
            emphasize
          />
        </div>

        {isLoading && (
          <div className="flex h-70 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Building comparison…
          </div>
        )}

        {!isLoading && error && (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
            {error}
          </div>
        )}

        {!isLoading && !error && result && result.points.length >= 2 && (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-70 w-full"
          >
            <LineChart
              data={result.points}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                domain={["auto", "auto"]}
                tickFormatter={(value: number) => value.toFixed(0)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as
                        | { date?: string }
                        | undefined;
                      return point?.date ?? "";
                    }}
                    formatter={(value, name) => {
                      const label =
                        name === "portfolio" ? "Portfolio" : BENCHMARK;
                      return (
                        <span className="font-medium tabular-nums">
                          {label}: {Number(value).toFixed(2)}
                        </span>
                      );
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="var(--color-portfolio)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="var(--color-benchmark)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}

        {result && result.missingTickers.length > 0 && !isLoading && (
          <p className="text-xs text-muted-foreground">
            Excluded (no history): {result.missingTickers.join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatBlock({
  label,
  value,
  loading,
  emphasize = false,
}: {
  label: string;
  value: number | null;
  loading: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          loading || value === null
            ? "text-muted-foreground"
            : value >= 0
              ? "text-emerald-600"
              : "text-red-600",
          emphasize && value !== null && !loading && "font-bold",
        )}
      >
        {loading ? "…" : value === null ? "—" : formatChangePercent(value)}
      </p>
    </div>
  );
}
