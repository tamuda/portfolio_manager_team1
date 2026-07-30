"use client";

/**
 * Soft-refresh the current route on a timer so Server Components
 * (dashboard stats, holdings table, watchlist preview) pick up new prices.
 */

import { useRouter } from "next/navigation";

import { usePolling } from "@/hooks/use-polling";
import { PRICE_POLL_MS } from "@/lib/live-prices";

export function LivePriceRefresh() {
  const router = useRouter();

  usePolling(() => {
    router.refresh();
  }, PRICE_POLL_MS);

  return null;
}
