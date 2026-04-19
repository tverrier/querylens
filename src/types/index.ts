export type AnalysisStatus = "pending" | "processing" | "complete" | "error" | "degraded";

export type BottleneckSeverity = "critical" | "warning" | "info";
export type NodeSeverity = "good" | "warning" | "critical";

export interface Bottleneck {
  nodeId: string;
  severity: BottleneckSeverity;
  title: string;
  explanation: string;
  recommendation: string;
}

export interface TreeNode {
  id: string;
  nodeType: string;
  relationName?: string;
  alias?: string;
  startupCost: number;
  totalCost: number;
  planRows: number;
  actualRows?: number;
  actualTime?: number;
  loops?: number;
  indexName?: string;
  joinType?: string;
  filterCondition?: string;
  severity: NodeSeverity;
  children: TreeNode[];
}

export interface QueryAnalysis {
  id: string;
  user_id: string;
  raw_sql: string;
  explain_output: Record<string, unknown> | null;
  execution_tree: TreeNode | null;
  ai_explanation: string | null;
  ai_bottlenecks: Bottleneck[] | null;
  optimized_query: string | null;
  estimated_improvement: string | null;
  index_suggestions: string[] | null;
  planner_insights: string | null;
  status: AnalysisStatus;
  error_message: string | null;
  share_token: string | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResponse {
  summary: string;
  bottlenecks: Bottleneck[];
  optimizedQuery: string;
  estimatedImprovement: string;
  indexSuggestions: string[];
  plannerInsights: string;
}
