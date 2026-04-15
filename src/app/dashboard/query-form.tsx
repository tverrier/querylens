"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QueryForm() {
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder="SELECT * FROM orders WHERE status = 'pending';"
        rows={8}
        className="w-full rounded border border-slate-800 bg-slate-900 p-3 font-mono text-sm focus:border-brand-500 focus:outline-none"
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !sql.trim()}
        className="rounded bg-brand-600 px-5 py-2.5 font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Analyze"}
      </button>
    </form>
  );
}
