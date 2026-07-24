"use client";

/**
 * Browser-tab-style bar: one tab per "opened" symbol, a "+" to add a new
 * one, and an overflow icon button in the corner.
 */

import { EllipsisIcon, PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type WatchlistTabBarProps = {
  openTickers: string[];
  activeTicker: string;
  onSelectTab: (ticker: string) => void;
  onCloseTab: (ticker: string) => void;
  onAddClick: () => void;
  onRemoveFromWatchlist: (ticker: string) => void;
};

export function WatchlistTabBar({
  openTickers,
  activeTicker,
  onSelectTab,
  onCloseTab,
  onAddClick,
  onRemoveFromWatchlist,
}: WatchlistTabBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2">
        {openTickers.map((ticker) => {
          const isActive = ticker === activeTicker;

          return (
            <div
              key={ticker}
              className={cn(
                "group/tab flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <button type="button" onClick={() => onSelectTab(ticker)}>
                {ticker}
              </button>
              {openTickers.length > 1 && (
                <button
                  type="button"
                  onClick={() => onCloseTab(ticker)}
                  aria-label={`Close ${ticker} tab`}
                  className="rounded-sm opacity-0 hover:bg-muted group-hover/tab:opacity-100"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onAddClick}
          aria-label="Add a symbol"
        >
          <PlusIcon />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="More options" />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onCloseTab(activeTicker)}
              disabled={openTickers.length <= 1}
            >
              Close Tab
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onRemoveFromWatchlist(activeTicker)}
            >
              Remove from Watchlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
