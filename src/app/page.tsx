import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-5xl font-bold tracking-tight">QueryLens</h1>
      <p className="mt-4 text-lg text-slate-300">
        Paste a SQL query, get an EXPLAIN plan, an AI walkthrough, and an optimized rewrite.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="rounded bg-brand-600 px-5 py-2.5 font-medium hover:bg-brand-700">
          Sign in
        </Link>
        <Link href="/dashboard" className="rounded border border-slate-700 px-5 py-2.5 font-medium hover:bg-slate-800">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
