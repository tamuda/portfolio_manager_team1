/** Loading placeholder matching the dashboard layout. */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
      <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
      <div className="mt-3 h-5 w-72 animate-pulse rounded-md bg-muted" />
      <div className="mt-6 h-9 w-36 animate-pulse rounded-md bg-muted" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border p-5"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-9 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-6">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="mx-auto mt-6 aspect-square max-h-[240px] w-full max-w-[240px] animate-pulse rounded-full bg-muted" />
        </div>
        <div className="rounded-xl border p-6">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-[240px] animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      <div className="mt-8 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
