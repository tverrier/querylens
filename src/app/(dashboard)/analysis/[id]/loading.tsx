import { TreeSkeleton } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AnalysisLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-6 w-48" />
      <Skeleton className="mt-2 h-4 w-20" />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr] lg:grid-cols-2">
        <TreeSkeleton />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
