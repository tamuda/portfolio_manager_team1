/**
 * Gathers market data for the morning summary. The client never receives
 * this bundle in one shot — the API streams picks, movers, and actions.
 */

import { getHoldingsPerformance } from "@/lib/api/holdings";
import { getNews, getQuote } from "@/lib/api/market-data";
import { getWatchlist } from "@/lib/api/watchlist";
import type { BriefLabels } from "@/lib/morning-summary/time-bound";
import type {
  MorningSummaryMover,
  MorningSummaryPayload,
} from "@/types/morning-summary";
import type { NewsItem, Quote } from "@/types/market-data";

const NEWS_PER_TICKER = 1;
const NEWS_LOOKBACK_MS = 24 * 60 * 60 * 1000;

function isWithinLast24Hours(publishedAt: string | null): boolean {
  if (!publishedAt) return true;
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return true;
  return Date.now() - published <= NEWS_LOOKBACK_MS;
}

async function safeQuote(ticker: string): Promise<Quote | null> {
  try {
    return await getQuote(ticker, "1D");
  } catch {
    return null;
  }
}

async function safeNews(ticker: string): Promise<NewsItem[]> {
  try {
    const response = await getNews(ticker, NEWS_PER_TICKER);
    return response.items.filter((item) =>
      isWithinLast24Hours(item.published_at),
    );
  } catch {
    return [];
  }
}

function toMover(
  ticker: string,
  quote: Quote,
  holdingTickers: Set<string>,
  watchlistTickers: string[],
): MorningSummaryMover {
  const inHoldings = holdingTickers.has(ticker);
  const inWatchlist = watchlistTickers.includes(ticker);

  return {
    ticker,
    name: quote.name,
    price: quote.price,
    change: quote.change,
    changePercent: quote.change_percent,
    points: quote.points,
    source:
      inHoldings && inWatchlist
        ? "both"
        : inHoldings
          ? "holding"
          : "watchlist",
  };
}

/** Minimal context for the LLM — not a portfolio dump. */
export function formatPayloadForAI(
  payload: MorningSummaryPayload,
  contextText: string,
  labels?: BriefLabels,
): string {
  const tickerLines = payload.availableTickers
    .map((ticker) => {
      const mover = payload.moversByTicker[ticker];
      if (!mover) return null;
      const pct =
        mover.changePercent !== null
          ? `${mover.changePercent >= 0 ? "+" : ""}${mover.changePercent.toFixed(2)}%`
          : "flat";
      return `${ticker} ${pct} (${mover.source})`;
    })
    .filter(Boolean)
    .join("\n");

  return [
    labels
      ? `Brief type: ${labels.period} — focus on moves ${labels.window}.`
      : "Focus on the most recent session and last 24 hours.",
    "Pick 1–2 tickers worth calling out. Ignore noise.",
    "",
    "Tickers:",
    tickerLines || "none",
    "",
    contextText,
  ].join("\n");
}

export async function buildMorningSummaryPayload(): Promise<{
  payload: MorningSummaryPayload;
  contextText: string;
}> {
  const [performanceResult, watchlistResult] = await Promise.allSettled([
    getHoldingsPerformance(),
    getWatchlist(),
  ]);

  const holdings =
    performanceResult.status === "fulfilled" ? performanceResult.value : [];
  const watchlist =
    watchlistResult.status === "fulfilled" ? watchlistResult.value : [];

  const holdingTickers = new Set(holdings.map((h) => h.ticker.toUpperCase()));
  const watchlistTickers = watchlist.map((item) => item.ticker.toUpperCase());
  const uniqueTickers = [
    ...new Set([...holdingTickers, ...watchlistTickers]),
  ];

  const quotes = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      const quote = await safeQuote(ticker);
      return { ticker, quote };
    }),
  );

  const moversByTicker: Record<string, MorningSummaryMover> = {};
  for (const { ticker, quote } of quotes) {
    if (!quote) continue;
    moversByTicker[ticker] = toMover(
      ticker,
      quote,
      holdingTickers,
      watchlistTickers,
    );
  }

  const sortedTickers = Object.values(moversByTicker)
    .sort(
      (a, b) =>
        Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0),
    )
    .map((m) => m.ticker);

  const newsTicker = sortedTickers[0];
  const newsItems = newsTicker ? await safeNews(newsTicker) : [];
  const topHeadline = newsItems[0];

  const totalGainLoss = holdings.reduce(
    (sum, h) => sum + parseFloat(h.gain_loss),
    0,
  );

  const contextLines = [
    `Portfolio unrealized: ${totalGainLoss >= 0 ? "+" : ""}$${totalGainLoss.toFixed(0)}`,
  ];

  if (topHeadline) {
    contextLines.push(`Headline: ${topHeadline.title.slice(0, 100)}`);
  }

  if (performanceResult.status === "rejected") {
    contextLines.push("Live holdings data was partial.");
  }

  const payload: MorningSummaryPayload = {
    generatedAt: new Date().toISOString(),
    moversByTicker,
    availableTickers: sortedTickers,
  };

  return {
    payload,
    contextText: contextLines.join("\n"),
  };
}

export function resolveFeaturedMover(
  payload: MorningSummaryPayload,
  ticker: string,
  note: string,
) {
  const normalized = ticker.trim().toUpperCase();
  const mover = payload.moversByTicker[normalized];
  if (!mover || !note.trim()) return null;

  return {
    ...mover,
    note: note.trim(),
  };
}
