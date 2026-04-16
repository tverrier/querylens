"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ExecutionTree from "@/components/visualization/ExecutionTree";
import type { ExecutionNode } from "@/lib/sql/execution-tree";

type Status = "pending" | "processing" | "complete" | "error" | "degraded";

type Analysis = {
  id: string;
  raw_sql: string;
  explain_output: unknown;
  execution_tree: ExecutionNode | null;
  ai_explanation: string | null;
  ai_bottlenecks: string[] | null;
  optimized_query: string | null;
  estimated_improvement: string | null;
  index_suggestions: string[] | null;
  planner_insights: string | null;
  status: Status;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
};

export default function AnalysisView({ initial }: { initial: Analysis }) {
  const [data, setData] = useState<Analysis>(initial);
  const done = data.status === "complete" || data.status === "error" || data.status === "degraded";

  useEffect(() => {
    if (done) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/analysis/${data.id}`, { cache: "no-store" });
      if (res.ok) {
        const fresh: Analysis = await res.json();
        setData(fresh);
        if (fresh.status === "complete" || fresh.status === "error" || fresh.status === "degraded") {
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [data.id, done]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-500 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Query analysis</h1>
      <div className="mt-2 flex items-center gap-3">
        <StatusBadge status={data.status} />
        {data.processing_time_ms != null && (
          <span className="text-xs text-slate-500">{data.processing_time_ms} ms</span>
        )}
      </div>

      <Section title="Raw SQL">
        <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">{data.raw_sql}</pre>
      </Section>

      {!done && (
        <p className="mt-8 text-slate-400">Analyzing… this page will update automatically.</p>
      )}

      {data.status === "error" && data.error_message && (
        <Section title="Error">
          <pre className="rounded bg-red-950/50 p-4 text-sm text-red-300">{data.error_message}</pre>
        </Section>
      )}

      {data.execution_tree && (
        <Section title="Execution plan">
          <div className="rounded bg-slate-900 p-4">
            <ExecutionTree tree={data.execution_tree} />
          </div>
        </Section>
      )}

      {data.ai_explanation && (
        <Section title="Explanation">
          <p className="whitespace-pre-wrap rounded bg-slate-900 p-4 text-sm leading-relaxed">
            {data.ai_explanation}
          </p>
        </Section>
      )}

      {data.ai_bottlenecks && data.ai_bottlenecks.length > 0 && (
        <Section title="Bottlenecks">
          <ul className="list-disc space-y-1 rounded bg-slate-900 p-4 pl-8 text-sm">
            {data.ai_bottlenecks.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </Section>
      )}

      {data.optimized_query && (
        <Section title={`Optimized query${data.estimated_improvement ? ` — ${data.estimated_improvement}` : ""}`}>
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">{data.optimized_query}</pre>
        </Section>
      )}

      {data.index_suggestions && data.index_suggestions.length > 0 && (
        <Section title="Suggested indexes">
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
            {data.index_suggestions.join("\n")}
          </pre>
        </Section>
      )}

      {data.planner_insights && (
        <Section title="Planner insights">
          <p className="whitespace-pre-wrap rounded bg-slate-900 p-4 text-sm leading-relaxed">
            {data.planner_insights}
          </p>
        </Section>
      )}

      {data.explain_output != null && (
        <Section title="EXPLAIN output">
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs">
            {JSON.stringify(data.explain_output, null, 2)}
          </pre>
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    pending: "bg-slate-700 text-slate-200",
    processing: "bg-amber-900 text-amber-200",
    complete: "bg-emerald-900 text-emerald-200",
    error: "bg-red-900 text-red-200",
    degraded: "bg-orange-900 text-orange-200",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${colors[status]}`}>{status}</span>
  );
}
