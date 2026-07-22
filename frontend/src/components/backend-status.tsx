import { getHealth } from "@/lib/api/health";

/**
 * Small badge in the navbar showing whether the FastAPI backend is reachable.
 * Rendered inside <Suspense> so the rest of the page doesn't block on this.
 */
export async function BackendStatus() {
  // Fetch first, render after — keeps JSX out of try/catch (eslint rule).
  let isOnline = false;
  let statusMessage = "";

  try {
    const health = await getHealth();
    isOnline = true;
    statusMessage = health.status;
  } catch {
    isOnline = false;
  }

  if (isOnline) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
        title={statusMessage}
      >
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        API online
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
      title="Start the backend with: uvicorn app.main:app --reload"
    >
      <span className="size-1.5 rounded-full bg-red-500" aria-hidden />
      API offline
    </span>
  );
}
