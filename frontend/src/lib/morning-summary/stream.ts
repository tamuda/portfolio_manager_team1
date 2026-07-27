/**
 * Pacing helpers for the staged morning-summary stream.
 * Text animation runs on the client — the server only sends stage boundaries.
 */

import type { MorningSummaryStreamEvent } from "@/types/morning-summary";

export const STAGE_PAUSE_MS = 550;
export const MOVER_PAUSE_MS = 750;
export const ACTION_PAUSE_MS = 500;

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function encodeStreamEvent(event: MorningSummaryStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}
