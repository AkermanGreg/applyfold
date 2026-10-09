/** Skeleton for a job detail page (posting + apply panel). */
export function JobLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]" aria-busy="true" aria-label="Loading job">
      <div className="flex flex-col gap-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
