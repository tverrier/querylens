export type ExecutionNode = {
  name: string;
  relation?: string;
  startupCost?: number;
  totalCost?: number;
  planRows?: number;
  actualRows?: number;
  actualTimeMs?: number;
  children: ExecutionNode[];
};

type RawPlan = {
  "Node Type"?: string;
  "Relation Name"?: string;
  "Startup Cost"?: number;
  "Total Cost"?: number;
  "Plan Rows"?: number;
  "Actual Rows"?: number;
  "Actual Total Time"?: number;
  Plans?: RawPlan[];
};

function normalize(plan: RawPlan): ExecutionNode {
  return {
    name: plan["Node Type"] ?? "Unknown",
    relation: plan["Relation Name"],
    startupCost: plan["Startup Cost"],
    totalCost: plan["Total Cost"],
    planRows: plan["Plan Rows"],
    actualRows: plan["Actual Rows"],
    actualTimeMs: plan["Actual Total Time"],
    children: (plan.Plans ?? []).map(normalize),
  };
}

export function buildExecutionTree(explainOutput: unknown): ExecutionNode | null {
  if (!explainOutput) return null;
  const root = Array.isArray(explainOutput) ? explainOutput[0] : explainOutput;
  if (!root || typeof root !== "object") return null;
  const plan = (root as { Plan?: RawPlan }).Plan;
  if (!plan) return null;
  return normalize(plan);
}
