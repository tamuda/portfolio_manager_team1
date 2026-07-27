"use client";

/**
 * Tiny inline trend line for a sidebar row — no axes, no tooltip, no grid.
 * Reads from the same Quote.points the main chart uses (see useQuote).
 *
 * A hidden YAxis with a dataMin/dataMax domain is required: without it,
 * Recharts scales from 0, so a few-percent move on a ~$300 stock looks flat.
 */

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

import { getChangeStrokeColor } from "@/lib/change-color";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/types/market-data";

type SparklineProps = {
  points: PricePoint[];
  change: number;
  className?: string;
};

export function Sparkline({ points, change, className }: SparklineProps) {
  if (points.length < 2) {
    return <div className={cn("h-8 w-16 shrink-0", className)} />;
  }

  const prices = points.map((point) => point.close);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.1 || 1;

  return (
    <div className={cn("h-8 w-16 shrink-0", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 2, right: 1, bottom: 2, left: 1 }}
        >
          <YAxis domain={[min - padding, max + padding]} hide />
          <Line
            type="monotone"
            dataKey="close"
            stroke={getChangeStrokeColor(change)}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
