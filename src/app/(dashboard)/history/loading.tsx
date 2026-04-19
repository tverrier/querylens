import { AnalysisRowSkeleton } from "@/components/ui/Skeleton";

export default function HistoryLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="h-8 w-24 animate-pulse rounded bg-tertiary" />

      <div className="mt-4 h-10 animate-pulse rounded-lg border border-border bg-secondary" />

      <div className="mt-6 divide-y divide-border rounded-xl border border-border">
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
        <AnalysisRowSkeleton />
      </div>
    </main>
  );
}
