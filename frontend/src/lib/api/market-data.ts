/**
 * Market data API — mirrors backend/app/routes/market_data.py
 *
 * Endpoints:
 *   GET /market-data/price/:ticker → latest closing price for a ticker
 *   GET /market-data/quote/:ticker → price, change, chart series & stats
 *   GET /market-data/news/:ticker  → recent headlines for a ticker
 */

import { apiFetch } from "@/lib/api/client";
import type { NewsResponse, Quote, TimeRange } from "@/types/market-data";

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

/** Fetch recent headlines for a ticker (Yahoo Finance via the backend). */
export async function getNews(
  ticker: string,
  limit = 5,
): Promise<NewsResponse> {
  return apiFetch<NewsResponse>(
    `/market-data/news/${encodeURIComponent(ticker)}?limit=${limit}`,
  );
}
