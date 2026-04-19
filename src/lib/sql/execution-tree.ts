import type { TreeNode, NodeSeverity } from "@/types";

export type { TreeNode };

type RawPlan = {
  "Node Type"?: string;
  "Relation Name"?: string;
  "Alias"?: string;
  "Startup Cost"?: number;
  "Total Cost"?: number;
  "Plan Rows"?: number;
  "Actual Rows"?: number;
  "Actual Total Time"?: number;
  "Index Name"?: string;
  "Join Type"?: string;
  "Filter"?: string;
  "Rows Removed by Filter"?: number;
  Plans?: RawPlan[];
};

let nodeCounter = 0;

function scoreSeverity(plan: RawPlan): NodeSeverity {
  const nodeType = (plan["Node Type"] ?? "").toLowerCase();
  const planRows = plan["Plan Rows"] ?? 0;
  const actualRows = plan["Actual Rows"];

  const isSeqScan = nodeType.includes("seq scan");
  if (isSeqScan && planRows > 100_000) return "critical";
  if (isSeqScan && planRows > 10_000) return "warning";

  if (actualRows != null && planRows > 0) {
    const ratio = actualRows / planRows;
    if (ratio > 10) return "critical";
    if (ratio > 5) return "warning";
  }

  const hashBatches = (plan as Record<string, unknown>)["Hash Batches"];
  if (typeof hashBatches === "number" && hashBatches > 1) return "warning";

  return "good";
}

function normalize(plan: RawPlan, prefix: string): TreeNode {
  const id = prefix || `node-${nodeCounter++}`;
  const children = (plan.Plans ?? []).map((child, i) =>
    normalize(child, `${id}-${i}`),
  );

  return {
    id,
    nodeType: plan["Node Type"] ?? "Unknown",
    relationName: plan["Relation Name"],
    alias: plan["Alias"],
    startupCost: plan["Startup Cost"] ?? 0,
    totalCost: plan["Total Cost"] ?? 0,
    planRows: plan["Plan Rows"] ?? 0,
    actualRows: plan["Actual Rows"],
    actualTime: plan["Actual Total Time"],
    indexName: plan["Index Name"],
    joinType: plan["Join Type"],
    filterCondition: plan["Filter"],
    severity: scoreSeverity(plan),
    children,
  };
}

export function buildExecutionTree(explainOutput: unknown): TreeNode | null {
  if (!explainOutput) return null;
  const root = Array.isArray(explainOutput) ? explainOutput[0] : explainOutput;
  if (!root || typeof root !== "object") return null;
  const plan = (root as { Plan?: RawPlan }).Plan;
  if (!plan) return null;
  nodeCounter = 0;
  return normalize(plan, "root");
}
