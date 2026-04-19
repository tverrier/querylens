import { CardSkeleton, AnalysisRowSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <div className="mt-10 space-y-3">
        <div className="h-5 w-32 animate-pulse rounded bg-tertiary" />
        <div className="h-[200px] animate-pulse rounded-lg border border-border bg-secondary" />
      </div>

      <div className="mt-12 space-y-0 divide-y divide-border rounded-xl border border-border">
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
      </div>
    </main>
  );
}
