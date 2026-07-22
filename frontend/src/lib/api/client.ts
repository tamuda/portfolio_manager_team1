/**
 * Shared fetch wrapper for all backend API calls.
 *
 * Every module in lib/api/ should use apiFetch() instead of raw fetch()
 * so error handling and base URL configuration live in one place.
 */

/** Thrown when the backend returns a non-2xx response. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Resolve the backend base URL from environment variables.
 * Works in both Server Components and Client Components.
 */
export function getApiBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;

  if (!url) {
    throw new Error(
      "Missing API base URL. Copy .env.example to .env.local and set NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  // Strip trailing slash so callers can safely append paths like "/holdings".
  return url.replace(/\/$/, "");
}

type ApiFetchOptions = RequestInit & {
  /** Next.js fetch cache mode. Defaults to "no-store" for fresh portfolio data. */
  cache?: RequestCache;
};

/**
 * Typed JSON fetch against the Portfolio Manager backend.
 *
 * @param path  Path after the base URL, e.g. "/holdings" or "/health"
 * @param options  Standard fetch options (method, body, etc.)
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { cache = "no-store", headers, ...rest } = options;

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    let detail = response.statusText;

    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Response body wasn't JSON — keep statusText.
    }

    throw new ApiError(detail, response.status);
  }

  // DELETE endpoints may return an empty body.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
