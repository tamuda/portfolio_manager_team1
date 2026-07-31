/**
 * Combined portfolio summary — GET /portfolio/summary
 */

import { apiFetch } from "@/lib/api/client";
import type { CombinedPortfolioSummary } from "@/types/portfolio";

export async function getCombinedPortfolioSummary(): Promise<CombinedPortfolioSummary> {
  return apiFetch<CombinedPortfolioSummary>("/portfolio/summary");
}
