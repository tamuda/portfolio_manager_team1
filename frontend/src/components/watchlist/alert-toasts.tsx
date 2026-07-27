"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AlertToast } from "@/hooks/use-watchlist-alerts";

type AlertToastsProps = {
  toasts: AlertToast[];
  onDismiss: (id: string) => void;
};

export function AlertToasts({ toasts, onDismiss }: AlertToastsProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-2 rounded-xl border border-amber-500/30 bg-background/95 px-3 py-3 text-sm shadow-lg backdrop-blur"
          role="status"
        >
          <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss alert"
          >
            <XIcon />
          </Button>
        </div>
      ))}
    </div>
  );
}
