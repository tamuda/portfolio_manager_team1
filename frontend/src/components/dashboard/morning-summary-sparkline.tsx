"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

import { getChangeStrokeColor } from "@/lib/change-color";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/types/market-data";

type MorningSummarySparklineProps = {
  points: PricePoint[];
  change: number;
  ticker: string;
  className?: string;
};

/** Larger featured sparkline with gradient fill and draw animation. */
export function MorningSummarySparkline({
  points,
  change,
  ticker,
  className,
}: MorningSummarySparklineProps) {
  const uid = useId();
  const fillId = `morning-spark-fill-${ticker}-${uid.replace(/:/g, "")}`;
  const stroke = getChangeStrokeColor(change);
  const isUp = change >= 0;

  if (points.length < 2) {
    return (
      <div
        className={cn(
          "h-[4.5rem] w-full rounded-xl bg-muted/30",
          className,
        )}
      />
    );
  }

  const prices = points.map((point) => point.close);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.14 || 1;

  return (
    <div
      className={cn(
        "relative h-[4.5rem] w-full overflow-hidden rounded-xl border border-white/10",
        isUp
          ? "bg-[linear-gradient(180deg,rgba(16,185,129,0.12)_0%,rgba(16,185,129,0.02)_55%,transparent_100%)]"
          : "bg-[linear-gradient(180deg,rgba(239,68,68,0.12)_0%,rgba(239,68,68,0.02)_55%,transparent_100%)]",
        className,
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 8, right: 6, bottom: 0, left: 6 }}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
              <stop offset="85%" stopColor={stroke} stopOpacity={0.05} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Area
            type="monotone"
            dataKey="close"
            stroke={stroke}
            strokeWidth={2.25}
            fill={`url(#${fillId})`}
            isAnimationActive
            animationDuration={1100}
            animationEasing="ease-out"
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
