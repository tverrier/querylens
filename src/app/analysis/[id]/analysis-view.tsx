"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Analysis = {
  id: string;
  raw_sql: string;
  explain_output: unknown;
  ai_explanation: string | null;
  optimized_query: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error: string | null;
  created_at: string;
};

export default function AnalysisView({ initial }: { initial: Analysis }) {
  const [data, setData] = useState<Analysis>(initial);
  const done = data.status === "completed" || data.status === "failed";

  useEffect(() => {
    if (done) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/analysis/${data.id}`, { cache: "no-store" });
      if (res.ok) {
        const fresh = await res.json();
        setData(fresh);
        if (fresh.status === "completed" || fresh.status === "failed") {
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
      <StatusBadge status={data.status} />

      <Section title="Raw SQL">
        <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">{data.raw_sql}</pre>
      </Section>

      {!done && (
        <p className="mt-8 text-slate-400">Analyzing… this page will update automatically.</p>
      )}

      {data.status === "failed" && (
        <Section title="Error">
          <pre className="rounded bg-red-950/50 p-4 text-sm text-red-300">{data.error}</pre>
        </Section>
      )}

      {data.explain_output != null && (
        <Section title="EXPLAIN output">
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs">
            {JSON.stringify(data.explain_output, null, 2)}
          </pre>
        </Section>
      )}

      {data.ai_explanation && (
        <Section title="AI explanation">
          <p className="whitespace-pre-wrap rounded bg-slate-900 p-4 text-sm leading-relaxed">
            {data.ai_explanation}
          </p>
        </Section>
      )}

      {data.optimized_query && (
        <Section title="Optimized query">
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">{data.optimized_query}</pre>
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

function StatusBadge({ status }: { status: Analysis["status"] }) {
  const colors: Record<Analysis["status"], string> = {
    pending: "bg-slate-700 text-slate-200",
    running: "bg-amber-900 text-amber-200",
    completed: "bg-emerald-900 text-emerald-200",
    failed: "bg-red-900 text-red-200",
  };
  return (
    <span className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${colors[status]}`}>
      {status}
    </span>
  );
}
