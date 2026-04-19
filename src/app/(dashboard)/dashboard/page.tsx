import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import QueryForm from "./query-form";
import { deleteAnalysis } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

async function getDashboardStats(supabase: ReturnType<typeof createClient>) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, weekRes, completeRes] = await Promise.all([
    supabase.from("query_analyses").select("id", { count: "exact", head: true }),
    supabase
      .from("query_analyses")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    supabase
      .from("query_analyses")
      .select("id", { count: "exact", head: true })
      .eq("status", "complete"),
  ]);

  return {
    total: totalRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
    optimized: completeRes.count ?? 0,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: analyses, count }, stats] = await Promise.all([
    supabase
      .from("query_analyses")
      .select("id, raw_sql, status, created_at, processing_time_ms", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to),
    getDashboardStats(supabase),
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 page-enter">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Analyses" value={stats.total} />
        <StatCard label="This Week" value={stats.thisWeek} />
        <StatCard label="Optimized" value={stats.optimized} />
        <StatCard
          label="Success Rate"
          value={
            stats.total > 0
              ? `${Math.round((stats.optimized / stats.total) * 100)}%`
              : "—"
          }
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Analyze a query</h2>
        <QueryForm />
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent analyses</h2>
          {(count ?? 0) > PAGE_SIZE && (
            <Link
              href="/history"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              View all
            </Link>
          )}
        </div>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {(analyses ?? []).length === 0 && (
            <li className="p-8 text-center">
              <p className="text-text-muted">No analyses yet</p>
              <p className="mt-1 text-sm text-text-muted">
                Paste a SQL query above to get started.
              </p>
            </li>
          )}
          {(analyses ?? []).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between p-4 hover:bg-hover transition-colors"
            >
              <div className="min-w-0 flex-1">
                <code className="block truncate font-mono text-sm text-text-primary">
                  {a.raw_sql}
                </code>
                <span className="text-xs text-text-muted">
                  {new Date(a.created_at).toLocaleString()} ·{" "}
                  <StatusDot status={a.status} />
                  {a.processing_time_ms != null &&
                    ` · ${a.processing_time_ms}ms`}
                </span>
              </div>
              <div className="ml-4 flex items-center gap-4">
                <Link
                  href={`/analysis/${a.id}`}
                  className="text-sm text-accent hover:underline"
                >
                  View
                </Link>
                <form action={deleteAnalysis.bind(null, a.id)}>
                  <button className="text-sm text-text-muted hover:text-critical transition-colors">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <nav className="mt-4 flex items-center justify-between text-sm text-text-muted">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-3">
              {page > 1 && (
                <Link
                  href={`/dashboard?page=${page - 1}`}
                  className="hover:text-text-primary"
                >
                  &larr; Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard?page=${page + 1}`}
                  className="hover:text-text-primary"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary p-4 hover:border-border-bright transition-colors">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="stat-value mt-1 text-text-primary">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "complete"
      ? "bg-good"
      : status === "error"
        ? "bg-critical"
        : status === "processing"
          ? "bg-accent"
          : status === "degraded"
            ? "bg-warning"
            : "bg-text-muted";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
      {status}
    </span>
  );
}
