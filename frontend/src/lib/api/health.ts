/**
 * Health check API — mirrors backend/app/routes/health.py
 *
 * Used by the navbar status badge to confirm the backend is reachable.
 */

import { apiFetch } from "@/lib/api/client";

type HealthResponse = {
  status: string;
};

/** Returns backend health payload. Throws ApiError if the API is down. */
export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}
