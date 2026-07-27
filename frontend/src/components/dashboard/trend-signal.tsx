"use client";

import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { ChevronUp } from "@/components/animate-ui/icons/chevron-up";
import { cn } from "@/lib/utils";

type TrendSignalProps = {
  value: number;
  className?: string;
  /** Icon circle size. Defaults to 32px. */
  size?: "sm" | "md";
};

/**
 * Animated up/down chevron for gain/loss. Re-triggers whenever `value` changes.
 */
export function TrendSignal({
  value,
  className,
  size = "md",
}: TrendSignalProps) {
  if (value === 0) return null;

  const isUp = value > 0;
  const Icon = isUp ? ChevronUp : ChevronDown;
  const isSmall = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        isSmall ? "size-6" : "size-8",
        isUp ? "bg-emerald-600/10" : "bg-red-600/10",
        className,
      )}
      aria-hidden
    >
      <Icon
        key={value}
        size={isSmall ? 14 : 18}
        animate
        animation="default-loop"
        initialOnAnimateEnd
        className={isUp ? "text-emerald-600" : "text-red-600"}
      />
    </span>
  );
}
