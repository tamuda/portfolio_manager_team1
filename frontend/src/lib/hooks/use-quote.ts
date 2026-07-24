"use client";

/**
 * Single shared data source for quotes: both the sidebar sparklines and the
 * main detail chart call this hook instead of duplicating fetch logic, so
 * they always read from the same underlying price-history data.
 */

import { useEffect, useState } from "react";

import { getQuoteAction } from "@/app/watchlist/actions";
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
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getQuoteAction(ticker, range).then((result) => {
      if (cancelled) return;

      setIsLoading(false);
      if (result.success && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else {
        setError(result.error ?? "Could not load market data.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ticker, range]);

  return { quote, isLoading, error };
}
