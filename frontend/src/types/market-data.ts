/**
 * TypeScript types that mirror the backend Pydantic schemas.
 *
 * Keep these in sync with:
 *   backend/app/schemas/market_data.py
 */

/** Chart lookback windows supported by GET /market-data/quote/:ticker */
export const TIME_RANGES = [
  "1D",
  "1W",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "2Y",
  "5Y",
  "10Y",
  "ALL",
] as const;

export type TimeRange = (typeof TIME_RANGES)[number];

export type PricePoint = {
  timestamp: string;
  close: number;
};

/** Stats grid values. Any field the backend can't source is null → rendered as "–". */
export type QuoteStats = {
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  avg_volume: number | null;
};

/** Response shape for GET /market-data/quote/:ticker */
export type Quote = {
  ticker: string;
  name: string | null;
  exchange: string | null;
  currency: string | null;
  price: number;
  previous_close: number | null;
  change: number;
  change_percent: number | null;
  points: PricePoint[];
  stats: QuoteStats;
};

/** Single headline from GET /market-data/news/:ticker */
export type NewsItem = {
  title: string;
  summary: string | null;
  published_at: string | null;
  source: string | null;
  url: string | null;
};

/** Response shape for GET /market-data/news/:ticker */
export type NewsResponse = {
  ticker: string;
  items: NewsItem[];
};
