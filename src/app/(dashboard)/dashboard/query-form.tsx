"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const MAX_CHARS = 10_000;

const DEMO_QUERIES = [
  { label: "Slow join", sql: "SELECT o.id, c.first_name, SUM(oi.quantity * oi.unit_price)\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nJOIN order_items oi ON oi.order_id = o.id\nWHERE o.created_at > '2024-01-01'\nGROUP BY o.id, c.first_name\nORDER BY 3 DESC\nLIMIT 50;" },
  { label: "Missing index", sql: "SELECT *\nFROM products\nWHERE category = 'Electronics'\n  AND price BETWEEN 100 AND 500\nORDER BY created_at DESC;" },
  { label: "Subquery", sql: "SELECT *\nFROM customers\nWHERE id IN (\n  SELECT customer_id\n  FROM orders\n  GROUP BY customer_id\n  HAVING COUNT(*) > 10\n);" },
];

export default function QueryForm() {
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (navigator.platform?.includes("Mac")) setModKey("Cmd");
  }, []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!sql.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      router.push(`/analysis/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {DEMO_QUERIES.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => setSql(q.sql)}
            className="rounded border border-border px-2.5 py-1 text-xs text-slate-400 hover:bg-surface hover:text-slate-200 transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM orders WHERE status = 'pending';"
          rows={8}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {sql.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
            <span className="ml-3 hidden sm:inline text-slate-600">
              {modKey}+Enter to submit
            </span>
          </span>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !sql.trim()}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Submitting..." : "Analyze"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
