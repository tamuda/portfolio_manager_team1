/**
 * Market data API — mirrors backend/app/routes/market_data.py
 *
 * Endpoints:
 *   GET /market-data/price/:ticker → latest closing price for a ticker
 *   GET /market-data/quote/:ticker → price, change, chart series & stats
 */

import { apiFetch } from "@/lib/api/client";
import type { Quote, TimeRange } from "@/types/market-data";

type PriceResponse = {
  ticker: string;
  price: string;
};

/** Fetch the latest closing price for a ticker (yfinance on backend). */
export async function getLatestPrice(ticker: string): Promise<PriceResponse> {
  return apiFetch<PriceResponse>(
    `/market-data/price/${encodeURIComponent(ticker)}`,
  );
}

/**
 * Fetch a full quote for the Watchlist view: current price/change, a chart
 * series for the given range, and stats grid values (yfinance on backend).
 */
export async function getQuote(ticker: string, range: TimeRange): Promise<Quote> {
  return apiFetch<Quote>(
    `/market-data/quote/${encodeURIComponent(ticker)}?range=${range}`,
  );
}
