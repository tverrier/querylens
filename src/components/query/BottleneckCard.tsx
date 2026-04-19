"use client";

import { useState } from "react";
import type { Bottleneck } from "@/types";

type Props = {
  bottleneck: Bottleneck;
  isSelected: boolean;
  onClick: () => void;
};

const SEVERITY_STYLES = {
  critical: {
    border: "border-l-[var(--critical)]",
    bg: "bg-critical-subtle",
    badge: "bg-[rgba(255,71,87,0.2)] text-[var(--critical)]",
  },
  warning: {
    border: "border-l-[var(--warning)]",
    bg: "bg-warning-subtle",
    badge: "bg-[rgba(255,165,2,0.2)] text-[var(--warning)]",
  },
  info: {
    border: "border-l-[var(--info)]",
    bg: "bg-info-subtle",
    badge: "bg-[rgba(83,82,237,0.2)] text-[var(--info)]",
  },
};

export function BottleneckCard({ bottleneck, isSelected, onClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const style = SEVERITY_STYLES[bottleneck.severity] ?? SEVERITY_STYLES.info;

  const copyRecommendation = async () => {
    await navigator.clipboard.writeText(bottleneck.recommendation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explanationTruncated =
    !expanded && bottleneck.explanation.length > 140;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border-l-[3px] ${style.border} ${style.bg} p-4 transition-all ${
        isSelected
          ? "ring-1 ring-accent shadow-[0_0_12px_var(--accent-glow)]"
          : "hover:brightness-110"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${style.badge}`}
        >
          {bottleneck.severity}
        </span>
        <h3 className="text-sm font-semibold text-text-primary">
          {bottleneck.title}
        </h3>
      </div>

      <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
        {explanationTruncated
          ? bottleneck.explanation.slice(0, 140) + "…"
          : bottleneck.explanation}
      </p>
      {explanationTruncated && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="mt-0.5 text-xs text-accent hover:underline"
        >
          show more
        </button>
      )}

      <div className="mt-2 flex items-start justify-between gap-2">
        <p className="font-mono text-xs leading-relaxed text-good">
          {bottleneck.recommendation}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyRecommendation();
          }}
          className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted hover:text-text-primary transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
