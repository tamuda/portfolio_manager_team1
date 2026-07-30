"use client";

/**
 * Single shared data source for quotes: both the sidebar sparklines and the
 * main detail chart call this hook instead of duplicating fetch logic, so
 * they always read from the same underlying price-history data.
 *
 * Polls on PRICE_POLL_MS while the tab is visible so quotes stay fresh.
 */

import { useEffect, useState } from "react";

import { getQuoteAction } from "@/app/watchlist/actions";
import { PRICE_POLL_MS } from "@/lib/live-prices";
import type { Quote, TimeRange } from "@/types/market-data";

type UseQuoteResult = {
  quote: Quote | null;
  isLoading: boolean;
  error: string | null;
};

export function useQuote(
  ticker: string | null,
  range: TimeRange,
): UseQuoteResult {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setQuote(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load(isInitial: boolean) {
      if (typeof document !== "undefined" && document.hidden && !isInitial) {
        return;
      }

      if (isInitial) setIsLoading(true);

      const result = await getQuoteAction(ticker!, range);
      if (cancelled) return;

      if (isInitial) setIsLoading(false);

      if (result.success && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else if (isInitial) {
        setError(result.error ?? "Could not load market data.");
      }
      // On poll failure, keep the last good quote on screen.
    }

    void load(true);

    const timer = window.setInterval(() => {
      void load(false);
    }, PRICE_POLL_MS);

    const onVisibility = () => {
      if (!document.hidden) void load(false);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ticker, range]);

  return { quote, isLoading, error };
}
