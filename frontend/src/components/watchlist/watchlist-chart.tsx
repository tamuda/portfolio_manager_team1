"use client";

/**
 * Main price chart: gradient-filled area, right-side price axis, bottom
 * time axis, and a hover crosshair (recharts' default line-type Tooltip
 * cursor, styled by the shared ChartContainer rules in ui/chart.tsx).
 */

import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getChangeStrokeColor } from "@/lib/change-color";
import type { PricePoint, TimeRange } from "@/types/market-data";

type WatchlistChartProps = {
  points: PricePoint[];
  change: number;
  range: TimeRange;
};

const INTRADAY_RANGES = new Set<TimeRange>(["1D"]);

function formatTick(timestamp: string, range: TimeRange): string {
  const date = new Date(timestamp);

  if (INTRADAY_RANGES.has(range)) {
    return date.toLocaleTimeString("en-US", { hour: "numeric" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MIN_TICKS = 4;
const MAX_TICKS = 14;
const PX_PER_TICK = 110;

/** More horizontal room means labels can be spaced further apart without
 * crowding, so a wider chart gets more date labels instead of the same
 * fixed count stretched across extra space. */
function computeTickCount(width: number): number {
  if (width <= 0) return 6;
  return Math.min(MAX_TICKS, Math.max(MIN_TICKS, Math.round(width / PX_PER_TICK)));
}

/**
 * Recharts' own interval/minTickGap heuristics force-anchor the last tick
 * to the final data point (crowding the right-side price axis) while
 * spacing the interior ticks by a separate calculation, so gaps end up
 * uneven. Picking a fixed, evenly index-spaced set of timestamps up front
 * keeps every gap equal regardless of range or dataset size.
 */
function computeAxisTicks(points: PricePoint[], tickCount: number): string[] {
  if (points.length <= tickCount) {
    return points.map((point) => point.timestamp);
  }

  const step = (points.length - 1) / (tickCount - 1);
  return Array.from({ length: tickCount }, (_, i) => {
    const index = Math.round(i * step);
    return points[index].timestamp;
  });
}

export function WatchlistChart({ points, change, range }: WatchlistChartProps) {
  const color = getChangeStrokeColor(change);
  const prices = points.map((point) => point.close);
  const padding = (Math.max(...prices) - Math.min(...prices)) * 0.1 || 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const tickCount = computeTickCount(containerWidth);

  // Weekly/monthly bars (1Y+) are timestamped at the start of their period —
  // the last bar is still in progress, so its raw timestamp can read weeks
  // behind today even though it holds the latest price. Since that point
  // represents "as of now," label it with today's real date instead.
  const lastTimestamp = points[points.length - 1]?.timestamp;
  const todayIso = new Date().toISOString();

  return (
    <div ref={containerRef} className="w-full">
      <ChartContainer
        config={{}}
        className="aspect-auto h-[clamp(200px,32vh,320px)] w-full"
      >
        <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="watchlist-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) =>
              formatTick(value === lastTimestamp ? todayIso : value, range)
            }
            ticks={computeAxisTicks(points, tickCount)}
            interval={0}
            padding={{ left: 48, right: 16 }}
          />
          <YAxis
            orientation="right"
            domain={[
              (dataMin: number) => dataMin - padding,
              (dataMax: number) => dataMax + padding,
            ]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => value.toFixed(0)}
            width={48}
          />
          <ChartTooltip
            cursor
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums">
                    {Number(value).toFixed(2)}
                  </span>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#watchlist-chart-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
