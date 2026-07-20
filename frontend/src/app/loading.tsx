export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="mt-3 h-5 w-64 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
