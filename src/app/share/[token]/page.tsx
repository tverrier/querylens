import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExecutionTree from "@/components/visualization/ExecutionTree";
import type { ExecutionNode } from "@/lib/sql/execution-tree";

export const revalidate = 60;

type SharedAnalysis = {
  raw_sql: string;
  execution_tree: ExecutionNode | null;
  ai_explanation: string | null;
  ai_bottlenecks: string[] | null;
  optimized_query: string | null;
  estimated_improvement: string | null;
  index_suggestions: string[] | null;
  planner_insights: string | null;
  processing_time_ms: number | null;
  created_at: string;
};

export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("query_analyses")
    .select(
      "raw_sql, execution_tree, ai_explanation, ai_bottlenecks, optimized_query, estimated_improvement, index_suggestions, planner_insights, processing_time_ms, created_at",
    )
    .eq("share_token", params.token)
    .single<SharedAnalysis>();

  if (!data) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-slate-500">Shared analysis</div>
      <h1 className="mt-1 text-3xl font-semibold">Query analysis</h1>
      <p className="mt-1 text-xs text-slate-500">
        {new Date(data.created_at).toLocaleString()}
        {data.processing_time_ms != null && ` · ${data.processing_time_ms} ms`}
      </p>

      <Section title="Raw SQL">
        <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">{data.raw_sql}</pre>
      </Section>

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
        <Section
          title={`Optimized query${data.estimated_improvement ? ` — ${data.estimated_improvement}` : ""}`}
        >
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
            {data.optimized_query}
          </pre>
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
