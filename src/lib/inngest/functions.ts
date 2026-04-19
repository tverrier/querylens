import { inngest } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import { analyzeWithClaude } from "@/lib/claude/analyze";
import { buildExecutionTree } from "@/lib/sql/execution-tree";
import { validateQuery } from "@/lib/sql/sandbox";
import { Client } from "pg";

async function runExplain(rawSql: string): Promise<unknown> {
  const gate = validateQuery(rawSql);
  if (!gate.ok) throw new Error(`sandbox rejected query: ${gate.reason}`);
  const safeSql = gate.sql;
  const url = process.env.TARGET_DATABASE_URL;
  if (!url) {
    return {
      stubbed: true,
      note: "Set TARGET_DATABASE_URL to run EXPLAIN against a real Postgres.",
      sql: rawSql,
    };
  }
  const client = new Client({ connectionString: url, statement_timeout: 5000 });
  await client.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query("SET search_path TO sandbox, public");
    const res = await client.query(`EXPLAIN (FORMAT JSON, ANALYZE false) ${safeSql}`);
    await client.query("ROLLBACK");
    return res.rows[0]?.["QUERY PLAN"] ?? res.rows;
  } finally {
    await client.end();
  }
}

export const analyzeQuery = inngest.createFunction(
  {
    id: "analyze-query",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const { analysisId } = (event.data.event.data ?? {}) as { analysisId?: string };
      if (!analysisId) return;
      const supabase = createServiceClient();
      await supabase
        .from("query_analyses")
        .update({ status: "error", error_message: error.message })
        .eq("id", analysisId);
    },
  },
  { event: "analyze/query.submitted" },
  async ({ event, step }) => {
    const { analysisId, rawSql } = event.data;
    const supabase = createServiceClient();
    const startedAt = Date.now();

    await step.run("mark-processing", async () => {
      await supabase
        .from("query_analyses")
        .update({ status: "processing" })
        .eq("id", analysisId);
    });

    const explainOutput = await step.run("run-explain", () => runExplain(rawSql));
    const executionTree = await step.run("build-tree", () => buildExecutionTree(explainOutput));
    const ai = await step.run("ai-explain", () => analyzeWithClaude(rawSql, explainOutput));

    await step.run("persist-results", async () => {
      await supabase
        .from("query_analyses")
        .update({
          status: ai.degraded ? "degraded" : "complete",
          explain_output: explainOutput,
          execution_tree: executionTree,
          ai_explanation: ai.response.summary,
          ai_bottlenecks: ai.response.bottlenecks,
          optimized_query: ai.response.optimizedQuery,
          estimated_improvement: ai.response.estimatedImprovement,
          index_suggestions: ai.response.indexSuggestions,
          planner_insights: ai.response.plannerInsights,
          processing_time_ms: Date.now() - startedAt,
        })
        .eq("id", analysisId);
    });

    return { analysisId, ok: true };
  },
);
