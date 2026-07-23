/**
 * Market data API — mirrors backend/app/routes/market_data.py
 *
 * Endpoints:
 *   GET /market-data/price/:ticker → latest closing price for a ticker
 */

import { apiFetch } from "@/lib/api/client";

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
