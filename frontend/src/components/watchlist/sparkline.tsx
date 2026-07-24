"use client";

/**
 * Tiny inline trend line for a sidebar row — no axes, no tooltip, no grid.
 * Reads from the same Quote.points the main chart uses (see useQuote).
 */

import { Line, LineChart, ResponsiveContainer } from "recharts";

import { getChangeStrokeColor } from "@/lib/change-color";
import type { PricePoint } from "@/types/market-data";

type SparklineProps = {
  points: PricePoint[];
  change: number;
};

export function Sparkline({ points, change }: SparklineProps) {
  if (points.length < 2) {
    return <div className="h-8 w-16 shrink-0" />;
  }

  return (
    <div className="h-8 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 2, right: 1, bottom: 2, left: 1 }}
        >
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
