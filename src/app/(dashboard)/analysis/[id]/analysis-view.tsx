"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ExecutionTree from "@/components/visualization/ExecutionTree";
import { BottleneckCard } from "@/components/query/BottleneckCard";
import { OptimizedQueryPanel } from "@/components/query/OptimizedQueryPanel";
import type { AnalysisStatus, Bottleneck, TreeNode } from "@/types";

type Analysis = {
  id: string;
  raw_sql: string;
  explain_output: unknown;
  execution_tree: TreeNode | null;
  ai_explanation: string | null;
  ai_bottlenecks: Bottleneck[] | null;
  optimized_query: string | null;
  estimated_improvement: string | null;
  index_suggestions: string[] | null;
  planner_insights: string | null;
  status: AnalysisStatus;
  error_message: string | null;
  share_token: string | null;
  processing_time_ms: number | null;
  created_at: string;
};

const POLL_INTERVALS = [2000, 5000, 10000];
const MAX_POLLS = 30;
const MAX_DURATION = 120_000;

const LOADING_STEPS = [
  { label: "Validating query", icon: "lightning" },
  { label: "Running EXPLAIN ANALYZE", icon: "tree" },
  { label: "Analyzing with AI", icon: "robot" },
  { label: "Building results", icon: "save" },
];

function useAnalysisPoller(initial: Analysis) {
  const [data, setData] = useState<Analysis>(initial);
  const done =
    data.status === "complete" ||
    data.status === "error" ||
    data.status === "degraded";

  useEffect(() => {
    if (done) return;
    let pollCount = 0;
    const startTime = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (pollCount >= MAX_POLLS || Date.now() - startTime > MAX_DURATION)
        return;
      try {
        const res = await fetch(`/api/analysis/${data.id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const fresh: Analysis = await res.json();
          setData(fresh);
          if (
            fresh.status === "complete" ||
            fresh.status === "error" ||
            fresh.status === "degraded"
          ) {
            return;
          }
        }
      } catch {
        // continue polling
      }
      pollCount++;
      const intervalIdx = Math.min(pollCount, POLL_INTERVALS.length - 1);
      timer = setTimeout(poll, POLL_INTERVALS[intervalIdx]);
    };

    timer = setTimeout(poll, POLL_INTERVALS[0]);
    return () => clearTimeout(timer);
  }, [data.id, done]);

  return data;
}

export default function AnalysisView({ initial }: { initial: Analysis }) {
  const data = useAnalysisPoller(initial);
  const done =
    data.status === "complete" ||
    data.status === "error" ||
    data.status === "degraded";
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleShare = async () => {
    if (!data.share_token) return;
    const url = `${window.location.origin}/share/${data.share_token}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <main className="page-enter mx-auto max-w-7xl px-6 py-8">
      <nav className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          &larr; Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-muted">
            {data.id.slice(0, 8)}
          </span>
          {data.share_token && (
            <button
              onClick={handleShare}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors"
            >
              {shareCopied ? "Link copied!" : "Share"}
            </button>
          )}
        </div>
      </nav>

      <div className="mt-4 flex items-center gap-3">
        <StatusBadge status={data.status} />
        {data.processing_time_ms != null && (
          <span className="font-mono text-xs text-text-muted">
            {data.processing_time_ms}ms
          </span>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors">
          Raw SQL
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-secondary p-4 font-mono text-sm text-text-secondary">
          {data.raw_sql}
        </pre>
      </details>

      {!done && <LoadingAnalysis status={data.status} />}

      {data.status === "error" && data.error_message && (
        <div className="mt-6 rounded-lg border border-critical bg-critical-subtle p-4">
          <h3 className="text-sm font-medium text-critical">Error</h3>
          <pre className="mt-2 text-sm text-text-secondary">
            {data.error_message}
          </pre>
        </div>
      )}

      {done && data.status !== "error" && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr] lg:grid-cols-2">
          {/* Left panel — Execution Tree */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {data.execution_tree ? (
              <div className="rounded-xl border border-border bg-secondary">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-sm font-medium">Execution plan</h2>
                </div>
                <div className="h-[500px]">
                  <ExecutionTree
                    tree={data.execution_tree}
                    bottlenecks={data.ai_bottlenecks ?? undefined}
                    selectedNodeId={selectedNodeId}
                    onNodeClick={handleNodeClick}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-secondary text-text-muted">
                No execution plan available
              </div>
            )}

            {data.explain_output != null && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Raw EXPLAIN output
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-secondary p-4 font-mono text-xs text-text-muted">
                  {JSON.stringify(data.explain_output, null, 2)}
                </pre>
              </details>
            )}
          </div>

          {/* Right panel — AI Analysis */}
          <div className="space-y-6">
            {data.ai_explanation && (
              <div className="rounded-xl border border-border bg-secondary p-5">
                <h2 className="text-sm font-medium text-text-secondary">
                  Summary
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">
                  {data.ai_explanation}
                </p>
              </div>
            )}

            {data.ai_bottlenecks && data.ai_bottlenecks.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-text-secondary">
                  Bottlenecks
                </h2>
                <div className="space-y-3">
                  {data.ai_bottlenecks.map((b, i) => (
                    <BottleneckCard
                      key={i}
                      bottleneck={b}
                      isSelected={selectedNodeId === b.nodeId}
                      onClick={() =>
                        setSelectedNodeId((prev) =>
                          prev === b.nodeId ? null : b.nodeId,
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {data.optimized_query && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-text-secondary">
                  Optimized query
                </h2>
                <OptimizedQueryPanel
                  originalSql={data.raw_sql}
                  optimizedQuery={data.optimized_query}
                  estimatedImprovement={data.estimated_improvement}
                  indexSuggestions={data.index_suggestions}
                />
              </div>
            )}

            {data.planner_insights && (
              <div className="rounded-xl border border-border bg-secondary p-5">
                <h2 className="text-sm font-medium text-text-secondary">
                  Planner insights
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                  {data.planner_insights}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: AnalysisStatus }) {
  const styles: Record<AnalysisStatus, { dot: string; text: string; label: string }> = {
    pending: { dot: "bg-text-muted", text: "text-text-secondary", label: "Queued" },
    processing: { dot: "bg-accent pulse", text: "text-accent", label: "Analyzing..." },
    complete: { dot: "bg-good", text: "text-good", label: "Complete" },
    error: { dot: "bg-critical", text: "text-critical", label: "Failed" },
    degraded: { dot: "bg-warning", text: "text-warning", label: "Partial" },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function LoadingAnalysis({ status }: { status: AnalysisStatus }) {
  const activeIdx = status === "pending" ? 0 : status === "processing" ? 1 : 2;

  return (
    <div className="mt-8 rounded-xl border border-border bg-secondary p-6" aria-live="polite">
      <p className="mb-4 text-sm text-text-secondary">
        Analyzing your query...
      </p>
      <div className="space-y-3">
        {LOADING_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i < activeIdx
                  ? "bg-good"
                  : i === activeIdx
                    ? "bg-accent pulse"
                    : "bg-tertiary"
              }`}
            />
            <span
              className={`text-sm transition-colors ${
                i < activeIdx
                  ? "text-good"
                  : i === activeIdx
                    ? "text-text-primary"
                    : "text-text-muted"
              }`}
            >
              {i < activeIdx && "✓ "}
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
