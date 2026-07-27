"use client";

import { MorningSummarySparkline } from "@/components/dashboard/morning-summary-sparkline";
import {
  formatChangePercent,
  getChangePillClasses,
  getChangeTextColor,
} from "@/lib/change-color";
import { cn } from "@/lib/utils";
import type { MorningSummaryFeaturedMover } from "@/types/morning-summary";

type MorningSummaryMoverCardProps = {
  mover: MorningSummaryFeaturedMover;
  className?: string;
};

export function MorningSummaryMoverCard({
  mover,
  className,
}: MorningSummaryMoverCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight">{mover.ticker}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
            {mover.note}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
            getChangePillClasses(mover.change),
          )}
        >
          {formatChangePercent(mover.changePercent)}
        </span>
      </div>

      <MorningSummarySparkline
        ticker={mover.ticker}
        points={mover.points}
        change={mover.change}
      />

      <div className="flex items-end justify-between gap-2 px-0.5">
        <p className="text-base font-semibold tabular-nums">
          ${mover.price.toFixed(2)}
        </p>
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            getChangeTextColor(mover.change),
          )}
        >
          {mover.change >= 0 ? "+" : ""}
          {mover.change.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
