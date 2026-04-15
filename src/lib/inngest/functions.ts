import { inngest } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import OpenAI from "openai";
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

    const ai = await step.run("ai-explain", async () => {
      if (!process.env.OPENAI_API_KEY) {
        return {
          explanation: "OpenAI key not configured. Add OPENAI_API_KEY to enable AI explanations.",
          optimized: rawSql,
        };
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a SQL performance expert. Given a query and its EXPLAIN output, return JSON with keys: explanation (plain English of what the query does and bottlenecks) and optimized (rewritten SQL).",
          },
          {
            role: "user",
            content: `SQL:\n${rawSql}\n\nEXPLAIN:\n${JSON.stringify(explainOutput)}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(completion.choices[0].message.content || "{}");
      return {
        explanation: parsed.explanation ?? "",
        optimized: parsed.optimized ?? rawSql,
      };
    });

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
