"use client";

/**
 * Left pane: search/filter box, "My Symbols" header with a sort affordance,
 * and the draggable list of watched symbols.
 */

import { useMemo, useRef, useState } from "react";
import { ChevronsUpDownIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { WatchlistRow } from "@/components/watchlist/watchlist-row";
import type { WatchlistItem } from "@/types/watchlist";

type SortMode = "manual" | "alphabetical";

type WatchlistSidebarProps = {
  items: WatchlistItem[];
  activeTicker: string | null;
  onSelect: (ticker: string) => void;
  onRemove: (id: number) => void;
  onReorder: (orderedIds: number[]) => void;
};

export function WatchlistSidebar({
  items,
  activeTicker,
  onSelect,
  onRemove,
  onReorder,
}: WatchlistSidebarProps) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const dragIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const visibleItems = useMemo(() => {
    const sorted =
      sortMode === "alphabetical"
        ? [...items].sort((a, b) => a.ticker.localeCompare(b.ticker))
        : items;

    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return sorted;

    return sorted.filter((item) => item.ticker.includes(trimmed));
  }, [items, query, sortMode]);

  function handleDragStart(index: number) {
    dragIndex.current = index;
    setDraggingId(items[index]?.id ?? null);
  }

  function handleDragEnter(index: number) {
    if (dragIndex.current === null || dragIndex.current === index) return;

    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(index, 0, moved);
    dragIndex.current = index;
    onReorder(reordered.map((item) => item.id));
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDraggingId(null);
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r">
      <div className="p-3">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Filter watchlist symbols"
            className="pl-7"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pb-1">
        <span className="text-xs font-semibold text-muted-foreground">
          My Symbols
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Sort watchlist"
              />
            }
          >
            <ChevronsUpDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortMode("manual")}>
              Sort Manually
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortMode("alphabetical")}>
              Sort Alphabetically
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-3">
        {visibleItems.map((item) => (
          <WatchlistRow
            key={item.id}
            item={item}
            isActive={item.ticker === activeTicker}
            isDragging={item.id === draggingId}
            onSelect={onSelect}
            onRemove={onRemove}
            onDragStart={() => handleDragStart(items.indexOf(item))}
            onDragEnter={() => handleDragEnter(items.indexOf(item))}
            onDragEnd={handleDragEnd}
          />
        ))}

        {visibleItems.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">
            {query ? "No matching symbols." : "Your watchlist is empty."}
          </li>
        )}
      </ul>
    </div>
  );
}
