import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { deleteAnalysis } from "../dashboard/actions";

const PAGE_SIZE = 50;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: analyses, count } = await supabase
    .from("query_analyses")
    .select("id, raw_sql, status, created_at, processing_time_ms, share_token", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">History</h1>
        <Link href="/dashboard" className="text-sm text-brand-500 hover:underline">
          ← Back to dashboard
        </Link>
      </header>

      <p className="mt-2 text-sm text-slate-500">
        {count ?? 0} total {count === 1 ? "analysis" : "analyses"}
      </p>

      <ul className="mt-6 divide-y divide-slate-800 rounded border border-slate-800">
        {(analyses ?? []).length === 0 && (
          <li className="p-4 text-slate-400">No analyses yet.</li>
        )}
        {(analyses ?? []).map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <code className="block truncate text-sm text-slate-300">{a.raw_sql}</code>
              <span className="text-xs text-slate-500">
                {new Date(a.created_at).toLocaleString()} · {a.status}
                {a.processing_time_ms != null && ` · ${a.processing_time_ms} ms`}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link href={`/analysis/${a.id}`} className="text-brand-500 hover:underline">
                View
              </Link>
              {a.share_token && (
                <Link
                  href={`/share/${a.share_token}`}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Share
                </Link>
              )}
              <form action={deleteAnalysis.bind(null, a.id)}>
                <button className="text-slate-500 hover:text-red-400">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-3">
            {page > 1 && (
              <Link href={`/history?page=${page - 1}`} className="hover:text-slate-200">
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/history?page=${page + 1}`} className="hover:text-slate-200">
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
