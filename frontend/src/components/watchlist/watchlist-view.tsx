"use client";

/**
 * Owns all Watchlist view state: the saved symbol list, which tabs are
 * "open" on the right, and which one is active. Mutations call the Server
 * Actions in app/watchlist/actions.ts and update local state optimistically
 * (revalidatePath refreshes the underlying Server Component data too).
 */

import { useState } from "react";

import {
  removeWatchlistItemAction,
  reorderWatchlistAction,
} from "@/app/watchlist/actions";
import { AddSymbolDialog } from "@/components/watchlist/add-symbol-dialog";
import { WatchlistDetail } from "@/components/watchlist/watchlist-detail";
import { WatchlistSidebar } from "@/components/watchlist/watchlist-sidebar";
import type { WatchlistItem } from "@/types/watchlist";

type WatchlistViewProps = {
  initialItems: WatchlistItem[];
};

export function WatchlistView({ initialItems }: WatchlistViewProps) {
  const [items, setItems] = useState(initialItems);
  const [openTickers, setOpenTickers] = useState<string[]>(
    initialItems.length > 0 ? [initialItems[0].ticker] : [],
  );
  const [activeTicker, setActiveTicker] = useState<string | null>(
    initialItems[0]?.ticker ?? null,
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleSelect(ticker: string) {
    setActiveTicker(ticker);
    setOpenTickers((current) =>
      current.includes(ticker) ? current : [...current, ticker],
    );
  }

  function handleCloseTab(ticker: string) {
    setOpenTickers((current) => {
      const next = current.filter((open) => open !== ticker);
      if (activeTicker === ticker) {
        setActiveTicker(next[next.length - 1] ?? null);
      }
      return next;
    });
  }

  function handleAdded(ticker: string) {
    setItems((current) => [
      ...current,
      { id: -Date.now(), ticker, position: current.length },
    ]);
    handleSelect(ticker);
  }

  function handleRemove(id: number) {
    const item = items.find((existing) => existing.id === id);
    setItems((current) => current.filter((existing) => existing.id !== id));
    if (item) handleCloseTab(item.ticker);

    removeWatchlistItemAction(id).then((result) => {
      if (!result.success) {
        setActionError(result.error ?? "Failed to remove symbol.");
      }
    });
  }

  function handleRemoveByTicker(ticker: string) {
    const item = items.find((existing) => existing.ticker === ticker);
    if (item) handleRemove(item.id);
  }

  function handleReorder(orderedIds: number[]) {
    setItems((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      return orderedIds
        .map((id) => byId.get(id))
        .filter((item): item is WatchlistItem => item !== undefined);
    });

    reorderWatchlistAction(orderedIds).then((result) => {
      if (!result.success) {
        setActionError(result.error ?? "Failed to save the new order.");
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {actionError && (
        <p
          className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive"
          role="alert"
        >
          {actionError}
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        <WatchlistSidebar
          items={items}
          activeTicker={activeTicker}
          onSelect={handleSelect}
          onRemove={handleRemove}
          onReorder={handleReorder}
        />
        <WatchlistDetail
          openTickers={openTickers}
          activeTicker={activeTicker}
          onSelectTab={handleSelect}
          onCloseTab={handleCloseTab}
          onAddClick={() => setAddDialogOpen(true)}
          onRemoveFromWatchlist={handleRemoveByTicker}
        />
      </div>

      <AddSymbolDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdded={handleAdded}
      />
    </div>
  );
}
