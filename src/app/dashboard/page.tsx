import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import QueryForm from "./query-form";
import { deleteAnalysis } from "./actions";

const PAGE_SIZE = 20;

export default async function DashboardPage({
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
    .select("id, raw_sql, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <form action="/auth/signout" method="post">
          <button className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">
            Sign out
          </button>
        </form>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Analyze a query</h2>
        <QueryForm />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Recent analyses</h2>
        <ul className="mt-4 divide-y divide-slate-800 rounded border border-slate-800">
          {(analyses ?? []).length === 0 && (
            <li className="p-4 text-slate-400">No analyses yet.</li>
          )}
          {(analyses ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <code className="block truncate text-sm text-slate-300">{a.raw_sql}</code>
                <span className="text-xs text-slate-500">
                  {new Date(a.created_at).toLocaleString()} · {a.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link href={`/analysis/${a.id}`} className="text-brand-500 hover:underline">
                  View
                </Link>
                <form action={deleteAnalysis.bind(null, a.id)}>
                  <button className="text-sm text-slate-500 hover:text-red-400">Delete</button>
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
                <Link href={`/dashboard?page=${page - 1}`} className="hover:text-slate-200">
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/dashboard?page=${page + 1}`} className="hover:text-slate-200">
                  Next →
                </Link>
              )}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
