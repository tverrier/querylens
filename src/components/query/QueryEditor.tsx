"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onSubmit: (sql: string) => void;
  isLoading: boolean;
  defaultValue?: string;
};

const MAX_CHARS = 10_000;

export function QueryEditor({ onSubmit, isLoading, defaultValue = "" }: Props) {
  const [sql, setSql] = useState(defaultValue);
  const [modKey, setModKey] = useState("Ctrl");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (navigator.platform?.includes("Mac")) setModKey("Cmd");
  }, []);

  useEffect(() => {
    setSql(defaultValue);
  }, [defaultValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (sql.trim() && !isLoading) onSubmit(sql);
    }
  };

  return (
    <div className="space-y-2">
      <div className="group relative">
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM orders WHERE status = 'pending';"
          rows={8}
          className="min-h-[160px] max-h-[400px] w-full resize-y rounded-lg border border-border bg-secondary p-4 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-glow transition-colors"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-muted">
          {sql.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          <span className="ml-3 hidden sm:inline">
            {modKey}+Enter to submit
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            if (sql.trim() && !isLoading) onSubmit(sql);
          }}
          disabled={isLoading || !sql.trim()}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing...
            </span>
          ) : (
            "Analyze Query"
          )}
        </button>
      </div>
    </div>
  );
}
