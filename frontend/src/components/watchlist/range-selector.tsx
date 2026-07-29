"use client";

import { TIME_RANGES, type TimeRange } from "@/types/market-data";
import { cn } from "@/lib/utils";

type RangeSelectorProps = {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
};

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-4 py-2">
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          aria-pressed={value === range}
          className={cn(
            "rounded-md px-2 py-1 text-[clamp(0.75rem,0.65rem+0.3vw,0.9375rem)] font-medium transition-colors",
            value === range
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
