import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExecutionTree from "@/components/visualization/ExecutionTree";
import { BottleneckCard } from "@/components/query/BottleneckCard";
import { OptimizedQueryPanel } from "@/components/query/OptimizedQueryPanel";
import type { TreeNode, Bottleneck } from "@/types";

export const revalidate = 60;

type SharedAnalysis = {
  raw_sql: string;
  execution_tree: TreeNode | null;
  ai_explanation: string | null;
  ai_bottlenecks: Bottleneck[] | null;
  optimized_query: string | null;
  estimated_improvement: string | null;
  index_suggestions: string[] | null;
  planner_insights: string | null;
  processing_time_ms: number | null;
  created_at: string;
};

export default async function SharePage({
  params,
}: {
  params: { token: string };
}) {
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
    <div className="min-h-screen">
      <nav className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-text-primary"
          >
            QueryLens
          </Link>
          <span className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent">
            Shared analysis
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8 page-enter">
        <p className="text-xs text-text-muted">
          {new Date(data.created_at).toLocaleString()}
          {data.processing_time_ms != null &&
            ` · ${data.processing_time_ms}ms`}
        </p>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors">
            Raw SQL
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-secondary p-4 font-mono text-sm text-text-secondary">
            {data.raw_sql}
          </pre>
        </details>

        {(data.execution_tree || data.ai_explanation) && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr] lg:grid-cols-2">
            <div>
              {data.execution_tree && (
                <div className="rounded-xl border border-border bg-secondary">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-sm font-medium">Execution plan</h2>
                  </div>
                  <div className="h-[400px] lg:h-[500px]">
                    <ExecutionTree tree={data.execution_tree} />
                  </div>
                </div>
              )}
            </div>

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
                        isSelected={false}
                        onClick={() => {}}
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

        {/* Sign-up CTA */}
        <div className="mt-12 rounded-xl border border-accent-subtle bg-accent-subtle p-8 text-center">
          <h2 className="text-xl font-semibold text-text-primary">
            Analyze your own SQL queries
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Get visual execution plans, AI-powered bottleneck analysis, and
            optimized rewrites — free.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Sign up free
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors"
            >
              Learn more
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
