"use client";

import { useState } from "react";

import { RangeSelector } from "@/components/watchlist/range-selector";
import { StatsGrid } from "@/components/watchlist/stats-grid";
import { WatchlistChart } from "@/components/watchlist/watchlist-chart";
import { WatchlistHeader } from "@/components/watchlist/watchlist-header";
import { WatchlistTabBar } from "@/components/watchlist/watchlist-tab-bar";
import { useQuote } from "@/lib/hooks/use-quote";
import type { TimeRange } from "@/types/market-data";

type WatchlistDetailProps = {
  openTickers: string[];
  activeTicker: string | null;
  onSelectTab: (ticker: string) => void;
  onCloseTab: (ticker: string) => void;
  onAddClick: () => void;
  onRemoveFromWatchlist: (ticker: string) => void;
};

export function WatchlistDetail({
  openTickers,
  activeTicker,
  onSelectTab,
  onCloseTab,
  onAddClick,
  onRemoveFromWatchlist,
}: WatchlistDetailProps) {
  const [range, setRange] = useState<TimeRange>("1D");
  const { quote, error } = useQuote(activeTicker, range);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <WatchlistTabBar
        openTickers={openTickers}
        activeTicker={activeTicker ?? ""}
        onSelectTab={(ticker) => {
          setRange("1D");
          onSelectTab(ticker);
        }}
        onCloseTab={onCloseTab}
        onAddClick={onAddClick}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
      />

      {!activeTicker && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Select a symbol to see its chart.
        </div>
      )}

      {activeTicker && error && (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {activeTicker && !error && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <WatchlistHeader ticker={activeTicker} quote={quote} />
          <RangeSelector value={range} onChange={setRange} />

          <div className="px-4 pt-4">
            {quote ? (
              <WatchlistChart
                points={quote.points}
                change={quote.change}
                range={range}
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Loading chart…
              </div>
            )}
          </div>

          {quote && <StatsGrid stats={quote.stats} />}

          <div className="px-4 py-3">
            <a
              href={`https://finance.yahoo.com/quote/${encodeURIComponent(activeTicker)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              See More Data from Yahoo Finance ›
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
