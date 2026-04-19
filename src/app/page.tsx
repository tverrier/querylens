import Link from "next/link";

const FEATURES = [
  {
    title: "Visual Execution Plans",
    description: "See your query's EXPLAIN plan as an interactive D3 tree with severity-colored nodes.",
  },
  {
    title: "AI-Powered Analysis",
    description: "Claude identifies bottlenecks, explains planner decisions, and suggests targeted indexes.",
  },
  {
    title: "Optimized Rewrites",
    description: "Get a rewritten query with estimated improvement and ready-to-run CREATE INDEX statements.",
  },
  {
    title: "Shareable Results",
    description: "Share analysis results with your team via a public link — no login required to view.",
  },
];

const DEMO_QUERIES = [
  {
    label: "Slow join",
    sql: "SELECT o.id, c.first_name, SUM(oi.quantity * oi.unit_price) FROM orders o JOIN customers c ON c.id = o.customer_id JOIN order_items oi ON oi.order_id = o.id WHERE o.created_at > '2024-01-01' GROUP BY o.id, c.first_name ORDER BY 3 DESC LIMIT 50;",
  },
  {
    label: "Missing index",
    sql: "SELECT * FROM products WHERE category = 'Electronics' AND price BETWEEN 100 AND 500 ORDER BY created_at DESC;",
  },
  {
    label: "Subquery",
    sql: "SELECT * FROM customers WHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) > 10);",
  },
];

export default function Home() {
  return (
    <main className="animate-page-enter">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">QueryLens</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Understand your SQL.
          <br />
          <span className="text-accent">Optimize it instantly.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          Paste a PostgreSQL query, get a visual execution plan, AI-powered bottleneck analysis,
          and an optimized rewrite — all in seconds.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium hover:bg-accent-hover transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="#demo"
            className="rounded-lg border border-slate-700 px-6 py-3 text-base font-medium text-slate-300 hover:bg-surface transition-colors"
          >
            Try a demo query
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-center">Try a demo query</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sign in to analyze these queries with a real EXPLAIN plan and AI insights.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {DEMO_QUERIES.map((q) => (
            <div key={q.label} className="rounded-xl border border-border bg-surface p-4">
              <span className="text-xs font-medium text-accent">{q.label}</span>
              <pre className="mt-2 overflow-x-auto text-xs text-slate-400 leading-relaxed">
                {q.sql}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-slate-500">
        QueryLens — AI-powered SQL analysis
      </footer>
    </main>
  );
}
