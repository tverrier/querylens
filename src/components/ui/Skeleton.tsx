type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-tertiary ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-secondary p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function AnalysisRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="ml-4 h-4 w-12" />
    </div>
  );
}

export function TreeSkeleton() {
  return (
    <div className="flex h-[500px] items-center justify-center rounded-xl border border-border bg-secondary">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex items-center justify-center gap-3">
          <Skeleton className="h-12 w-32 rounded-lg" />
        </div>
        <div className="flex items-center justify-center gap-6">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
