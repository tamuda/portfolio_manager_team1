import { redirect } from "next/navigation";

import { WatchlistView } from "@/components/watchlist/watchlist-view";
import { ApiError } from "@/lib/api/client";
import { getWatchlist } from "@/lib/api/watchlist";
import type { WatchlistItem } from "@/types/watchlist";

/**
 * Watchlist page — Server Component.
 *
 * Fetches the saved symbol list once; all further interaction (tabs,
 * charts, add/remove/reorder) is handled client-side in WatchlistView.
 */
export default async function WatchlistPage() {
  let items: WatchlistItem[] = [];
  let errorMessage: string | null = null;

  try {
    items = await getWatchlist();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Could not reach the backend. Is it running on port 8000?";
  }

  if (errorMessage) {
    return (
      <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="mt-2 text-destructive">{errorMessage}</p>
      </div>
    );
  }

  return <WatchlistView initialItems={items} />;
}
