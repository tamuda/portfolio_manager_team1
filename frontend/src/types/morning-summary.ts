import type { PricePoint } from "@/types/market-data";

export type MorningSummaryMover = {
  ticker: string;
  name: string | null;
  price: number;
  change: number;
  changePercent: number | null;
  points: PricePoint[];
  source: "holding" | "watchlist" | "both";
};

export type MorningSummaryFeaturedMover = MorningSummaryMover & {
  note: string;
};

export type MorningSummaryMood = "bullish" | "bearish" | "mixed" | "calm";

export type MorningSummaryAction = {
  label: string;
  href: "/portfolios" | "/watchlist" | "/";
};

export type MorningSummaryPick = {
  ticker: string;
  note: string;
};

export type MorningSummaryStage =
  | "opening"
  | "mood"
  | "story"
  | "charts"
  | "actions";

/** Internal server-side bundle — never sent wholesale to the client. */
export type MorningSummaryPayload = {
  generatedAt: string;
  moversByTicker: Record<string, MorningSummaryMover>;
  availableTickers: string[];
};

export type MorningSummaryStreamEvent =
  | { event: "stage"; stage: MorningSummaryStage }
  | { event: "headline"; text: string }
  | { event: "mood"; value: MorningSummaryMood }
  | { event: "story"; text: string }
  | { event: "mover"; data: MorningSummaryFeaturedMover }
  | { event: "action"; data: MorningSummaryAction }
  | { event: "done"; generatedAt: string }
  | { event: "error"; message: string };
