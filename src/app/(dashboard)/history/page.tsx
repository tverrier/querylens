import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { deleteAnalysis } from "../dashboard/actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const search = searchParams.q?.trim();

  let query = supabase
    .from("query_analyses")
    .select(
      "id, raw_sql, status, created_at, processing_time_ms, share_token",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("raw_sql", `%${search}%`);
  }

  const { data: analyses, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 page-enter">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">History</h2>
        <p className="text-sm text-text-muted">
          {count ?? 0} {count === 1 ? "analysis" : "analyses"}
        </p>
      </div>

      <form className="mt-4">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search queries..."
          className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-glow transition-colors"
        />
      </form>

      <ul className="mt-6 divide-y divide-border rounded-xl border border-border">
        {(analyses ?? []).length === 0 && (
          <li className="p-8 text-center">
            <p className="text-text-muted">
              {search ? "No analyses match your search." : "No analyses yet."}
            </p>
            {!search && (
              <Link
                href="/dashboard"
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                Go to dashboard to analyze a query
              </Link>
            )}
          </li>
        )}
        {(analyses ?? []).map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-4 p-4 hover:bg-hover transition-colors"
          >
            <div className="min-w-0 flex-1">
              <code className="block truncate font-mono text-sm text-text-primary">
                {a.raw_sql}
              </code>
              <span className="text-xs text-text-muted">
                {new Date(a.created_at).toLocaleString()} · {a.status}
                {a.processing_time_ms != null &&
                  ` · ${a.processing_time_ms}ms`}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/analysis/${a.id}`}
                className="text-accent hover:underline"
              >
                View
              </Link>
              {a.share_token && (
                <Link
                  href={`/share/${a.share_token}`}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Share
                </Link>
              )}
              <form action={deleteAnalysis.bind(null, a.id)}>
                <button className="text-text-muted hover:text-critical transition-colors">
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
                href={`/history?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="hover:text-text-primary transition-colors"
              >
                &larr; Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/history?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="hover:text-text-primary transition-colors"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
