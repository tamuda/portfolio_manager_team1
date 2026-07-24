"use client";

/**
 * One row in the sidebar symbol list: sparkline + price + change badge.
 * Draggable for reordering; the "…" menu offers removal (mirrors the
 * confirm-then-delete pattern used for holdings).
 */

import { useState } from "react";
import { EllipsisIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkline } from "@/components/watchlist/sparkline";
import { formatChangePercent, getChangePillClasses } from "@/lib/change-color";
import { useQuote } from "@/lib/hooks/use-quote";
import { cn } from "@/lib/utils";
import type { WatchlistItem } from "@/types/watchlist";

type WatchlistRowProps = {
  item: WatchlistItem;
  isActive: boolean;
  isDragging: boolean;
  onSelect: (ticker: string) => void;
  onRemove: (id: number) => void;
  onDragStart: (event: React.DragEvent<HTMLLIElement>) => void;
  onDragEnter: (event: React.DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
};

export function WatchlistRow({
  item,
  isActive,
  isDragging,
  onSelect,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: WatchlistRowProps) {
  const { quote } = useQuote(item.ticker, "1D");
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragEnd={onDragEnd}
      className={cn(
        "group/row flex items-center gap-1 rounded-lg border px-1.5 py-2 transition-colors",
        isActive
          ? "border-border bg-muted"
          : "border-transparent hover:bg-muted/50",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(item.ticker)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.ticker}</p>
          <p className="truncate text-xs text-muted-foreground">
            {quote?.name ?? " "}
          </p>
        </div>

        {quote && quote.points.length > 1 && (
          <Sparkline points={quote.points} change={quote.change} />
        )}

        <div className="flex w-16 shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-semibold tabular-nums">
            {quote ? quote.price.toFixed(2) : "—"}
          </span>
          {quote && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
                getChangePillClasses(quote.change),
              )}
            >
              {formatChangePercent(quote.change_percent)}
            </span>
          )}
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover/row:opacity-100"
              aria-label={`More options for ${item.ticker}`}
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            Remove from Watchlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {item.ticker}?</DialogTitle>
            <DialogDescription>
              This removes {item.ticker} from your watchlist. You can add it
              back later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onRemove(item.id);
                setConfirmOpen(false);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
