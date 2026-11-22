export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-2 h-3 w-1/3" />
    </div>
  );
}

export function ListingGridSkeleton({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-64" />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index}>
            <CardSkeleton />
          </li>
        ))}
        <li className="sr-only">Loading {label}...</li>
      </ul>
    </div>
  );
}

export function HomeFeedSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border border-line bg-card p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index}>
            <CardSkeleton />
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading live numbers...</p>
    </div>
  );
}
