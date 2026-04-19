"use client";

import { useState } from "react";

type Props = {
  originalSql: string;
  optimizedQuery: string;
  estimatedImprovement?: string | null;
  indexSuggestions?: string[] | null;
};

function diffLines(
  original: string,
  optimized: string,
): { text: string; type: "same" | "added" | "removed" }[] {
  const origLines = original.trim().split("\n");
  const optLines = optimized.trim().split("\n");
  const origSet = new Set(origLines.map((l) => l.trim()));
  const optSet = new Set(optLines.map((l) => l.trim()));

  const result: { text: string; type: "same" | "added" | "removed" }[] = [];

  for (const line of origLines) {
    if (!optSet.has(line.trim())) {
      result.push({ text: line, type: "removed" });
    }
  }
  for (const line of optLines) {
    if (origSet.has(line.trim())) {
      result.push({ text: line, type: "same" });
    } else {
      result.push({ text: line, type: "added" });
    }
  }

  return result;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors"
    >
      {copied ? "Copied!" : label ?? "Copy"}
    </button>
  );
}

export function OptimizedQueryPanel({
  originalSql,
  optimizedQuery,
  estimatedImprovement,
  indexSuggestions,
}: Props) {
  const [view, setView] = useState<"diff" | "optimized">("diff");
  const lines = diffLines(originalSql, optimizedQuery);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setView("diff")}
              className={`px-3 py-1.5 text-xs transition-colors ${view === "diff" ? "bg-accent-subtle text-accent" : "text-text-secondary hover:text-text-primary"}`}
            >
              Diff
            </button>
            <button
              onClick={() => setView("optimized")}
              className={`px-3 py-1.5 text-xs transition-colors ${view === "optimized" ? "bg-accent-subtle text-accent" : "text-text-secondary hover:text-text-primary"}`}
            >
              Optimized
            </button>
          </div>
          {estimatedImprovement && (
            <span className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent">
              {estimatedImprovement}
            </span>
          )}
        </div>
        <CopyButton text={optimizedQuery} label="Copy query" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-secondary">
        {view === "diff" ? (
          <pre className="p-4 font-mono text-sm leading-relaxed">
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "added"
                    ? "bg-good-subtle text-good"
                    : line.type === "removed"
                      ? "bg-critical-subtle text-critical line-through"
                      : "text-text-secondary"
                }
              >
                <span className="mr-3 inline-block w-4 text-right text-text-muted">
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </span>
                {line.text}
              </div>
            ))}
          </pre>
        ) : (
          <pre className="p-4 font-mono text-sm leading-relaxed text-good">
            {optimizedQuery}
          </pre>
        )}
      </div>

      {indexSuggestions && indexSuggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-secondary">
            Suggested indexes
          </h4>
          {indexSuggestions.map((idx, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary p-3"
            >
              <code className="font-mono text-xs text-text-primary">{idx}</code>
              <CopyButton text={idx} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
