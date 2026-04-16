import { inngest } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import { analyzeWithClaude } from "@/lib/claude/analyze";
import { Client } from "pg";

async function runExplain(rawSql: string): Promise<unknown> {
  const url = process.env.TARGET_DATABASE_URL;
  if (!url) {
    return {
      stubbed: true,
      note: "Set TARGET_DATABASE_URL to run EXPLAIN against a real Postgres.",
      sql: rawSql,
    };
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const res = await client.query(`EXPLAIN (FORMAT JSON) ${rawSql}`);
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
        .update({ status: "failed", error: error.message })
        .eq("id", analysisId);
    },
  },
  { event: "query/analyze.requested" },
  async ({ event, step }) => {
    const { analysisId, rawSql } = event.data;
    const supabase = createServiceClient();

    await step.run("mark-running", async () => {
      await supabase
        .from("query_analyses")
        .update({ status: "running" })
        .eq("id", analysisId);
    });

    const explainOutput = await step.run("run-explain", () => runExplain(rawSql));

    const ai = await step.run("ai-explain", () => analyzeWithClaude(rawSql, explainOutput));

    await step.run("persist-results", async () => {
      await supabase
        .from("query_analyses")
        .update({
          status: "completed",
          explain_output: explainOutput,
          ai_explanation: ai.explanation,
          optimized_query: ai.optimized,
        })
        .eq("id", analysisId);
    });

    return { analysisId, ok: true };
  },
);
