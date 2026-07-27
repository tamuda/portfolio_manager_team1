/**
 * Staged portfolio brief: headline → story → charts → actions.
 * Copy and AI framing adapt to the user's local time of day.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { streamObject } from "ai";

import {
  buildMorningSummaryPayload,
  formatPayloadForAI,
  resolveFeaturedMover,
} from "@/lib/morning-summary/payload";
import { morningSummaryInsightSchema } from "@/lib/morning-summary/schema";
import {
  ACTION_PAUSE_MS,
  encodeStreamEvent,
  MOVER_PAUSE_MS,
  sleep,
  STAGE_PAUSE_MS,
} from "@/lib/morning-summary/stream";
import {
  getBriefInstructions,
  getBriefLabelsForHour,
  parseLocalHour,
} from "@/lib/morning-summary/time-bound";
import type {
  MorningSummaryAction,
  MorningSummaryStreamEvent,
} from "@/types/morning-summary";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GATEWAY_MODEL = "openai/gpt-4o-mini";

const VALID_HREFS = new Set<MorningSummaryAction["href"]>([
  "/",
  "/portfolios",
  "/watchlist",
]);

function resolveModel() {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();

  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai(process.env.MORNING_SUMMARY_MODEL ?? DEFAULT_OPENAI_MODEL);
  }

  if (gatewayKey?.startsWith("sk-")) {
    throw new Error(
      "AI_GATEWAY_API_KEY looks like an OpenAI key. Rename it to OPENAI_API_KEY in .env.local and restart the Next.js server.",
    );
  }

  if (gatewayKey) {
    return process.env.MORNING_SUMMARY_MODEL ?? DEFAULT_GATEWAY_MODEL;
  }

  throw new Error(
    "Missing OPENAI_API_KEY (or AI_GATEWAY_API_KEY). Add it to frontend/.env.local and restart the Next.js server.",
  );
}

function isReadyAction(
  action: Partial<MorningSummaryAction>,
): action is MorningSummaryAction {
  return (
    typeof action.label === "string" &&
    action.label.trim().length > 0 &&
    typeof action.href === "string" &&
    VALID_HREFS.has(action.href)
  );
}

export async function POST(request: Request) {
  try {
    let localHour: number | undefined;
    try {
      const body = (await request.json()) as { localHour?: unknown };
      localHour = parseLocalHour(body.localHour);
    } catch {
      // Empty body is fine — fall back to server time.
    }

    const labels = getBriefLabelsForHour(localHour);
    const model = resolveModel();
    const { payload, contextText } = await buildMorningSummaryPayload();
    const prompt = formatPayloadForAI(payload, contextText, labels);

    const result = streamObject({
      model,
      schema: morningSummaryInsightSchema,
      system: getBriefInstructions(labels),
      prompt,
      onError({ error }) {
        console.error("Portfolio brief stream error:", error);
      },
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: MorningSummaryStreamEvent) => {
          controller.enqueue(encodeStreamEvent(event));
        };

        try {
          emit({ event: "stage", stage: "opening" });

          // streamObject only completes if the partial stream is consumed.
          // Ignore partial headline tokens — emit the final headline once.
          for await (const _partial of result.partialObjectStream) {
            void _partial;
          }

          const final = await result.object;

          if (final.headline?.trim()) {
            emit({ event: "headline", text: final.headline.trim() });
          }

          await sleep(STAGE_PAUSE_MS);
          emit({ event: "stage", stage: "mood" });
          emit({ event: "mood", value: final.mood });

          await sleep(STAGE_PAUSE_MS);
          emit({ event: "stage", stage: "story" });
          emit({ event: "story", text: final.story.trim() });

          await sleep(STAGE_PAUSE_MS);
          emit({ event: "stage", stage: "charts" });

          for (const pick of final.picks ?? []) {
            const ticker = pick.ticker?.trim().toUpperCase();
            const note = pick.note?.trim();
            if (!ticker || !note) continue;

            const featured = resolveFeaturedMover(payload, ticker, note);
            if (!featured) continue;

            await sleep(MOVER_PAUSE_MS);
            emit({ event: "mover", data: featured });
          }

          await sleep(STAGE_PAUSE_MS);
          emit({ event: "stage", stage: "actions" });

          for (const action of final.actions ?? []) {
            if (!isReadyAction(action)) continue;
            await sleep(ACTION_PAUSE_MS);
            emit({ event: "action", data: action });
          }

          emit({ event: "done", generatedAt: payload.generatedAt });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not generate insights.";
          emit({ event: "error", message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Portfolio brief failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not generate your brief.";

    return Response.json({ error: message }, { status: 500 });
  }
}
