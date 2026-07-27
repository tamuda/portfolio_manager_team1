import { z } from "zod";

export const morningSummaryInsightSchema = z.object({
  headline: z
    .string()
    .describe("4–8 words. Evocative title for this time-of-day brief."),
  mood: z.enum(["bullish", "bearish", "mixed", "calm"]),
  story: z
    .string()
    .describe(
      "A flowing 3–5 sentence narrative, 80–120 words. Tell the story of the last 24 hours for this portfolio — calm, human, specific tickers and percentages from the data. Connected prose, not bullets.",
    ),
  picks: z
    .array(
      z.object({
        ticker: z
          .string()
          .describe("Exact ticker from the provided list."),
        note: z
          .string()
          .describe("Short caption for the chart card. Max 8 words."),
      }),
    )
    .max(2)
    .describe("1–2 tickers to visualize — the ones the story focuses on."),
  actions: z
    .array(
      z.object({
        label: z.string().describe("2–4 words."),
        href: z.enum(["/portfolios", "/watchlist", "/"]),
      }),
    )
    .max(2),
});

export type MorningSummaryInsightSchema = z.infer<
  typeof morningSummaryInsightSchema
>;
