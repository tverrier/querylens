import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { AnalysisResponse, Bottleneck } from "@/types";

const BottleneckSchema = z.object({
  nodeId: z.string(),
  severity: z.enum(["critical", "warning", "info"]),
  title: z.string(),
  explanation: z.string(),
  recommendation: z.string(),
});

const AnalysisResponseSchema = z.object({
  summary: z.string(),
  bottlenecks: z.array(BottleneckSchema),
  optimizedQuery: z.string(),
  estimatedImprovement: z.string(),
  indexSuggestions: z.array(z.string()),
  plannerInsights: z.string(),
});

export { AnalysisResponseSchema };

export function buildAnalysisPrompt(rawSql: string, explainOutput: unknown): string {
  return [
    "Analyze this PostgreSQL query and its EXPLAIN plan.",
    "",
    "## SQL",
    "```sql",
    rawSql,
    "```",
    "",
    "## EXPLAIN Output",
    "```json",
    JSON.stringify(explainOutput, null, 2),
    "```",
    "",
    "Respond with ONLY valid JSON matching this exact shape:",
    "```json",
    JSON.stringify({
      summary: "Plain-English summary of what the query does and its performance characteristics",
      bottlenecks: [
        {
          nodeId: "root-0 (matches a node id from the execution tree)",
          severity: "critical | warning | info",
          title: "Short title",
          explanation: "Why this is a bottleneck",
          recommendation: "How to fix it",
        },
      ],
      optimizedQuery: "Rewritten SQL query",
      estimatedImprovement: "e.g. 2-5x faster",
      indexSuggestions: ["CREATE INDEX ..."],
      plannerInsights: "Notes on planner choices (join order, scan types, etc.)",
    }, null, 2),
    "```",
  ].join("\n");
}

export function buildFallbackPrompt(rawSql: string): string {
  return [
    "Analyze this SQL query WITHOUT an EXPLAIN plan. Provide your best assessment based on the query structure alone.",
    "",
    "## SQL",
    "```sql",
    rawSql,
    "```",
    "",
    "Respond with ONLY valid JSON matching this exact shape:",
    "```json",
    JSON.stringify({
      summary: "Plain-English summary of the query and likely performance issues",
      bottlenecks: [
        {
          nodeId: "unknown",
          severity: "critical | warning | info",
          title: "Short title",
          explanation: "Why this might be a bottleneck",
          recommendation: "How to fix it",
        },
      ],
      optimizedQuery: "Rewritten SQL query",
      estimatedImprovement: "e.g. 2-5x faster (estimated without EXPLAIN data)",
      indexSuggestions: ["CREATE INDEX ..."],
      plannerInsights: "Likely planner behavior based on query structure",
    }, null, 2),
    "```",
  ].join("\n");
}

const SYSTEM_PROMPT =
  "You are a PostgreSQL performance expert. You analyze SQL queries and EXPLAIN plans to identify bottlenecks and suggest optimizations. " +
  "Always respond with valid JSON only — no markdown fences, no commentary outside the JSON object.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return "{}";
}

async function callClaude(prompt: string): Promise<AnalysisResponse> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const raw = JSON.parse(extractJson(text));
  return AnalysisResponseSchema.parse(raw);
}

const EMPTY_RESPONSE: AnalysisResponse = {
  summary: "",
  bottlenecks: [],
  optimizedQuery: "",
  estimatedImprovement: "",
  indexSuggestions: [],
  plannerInsights: "",
};

export async function analyzeWithClaude(
  rawSql: string,
  explainOutput: unknown,
): Promise<{ response: AnalysisResponse; degraded: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      response: {
        ...EMPTY_RESPONSE,
        summary: "ANTHROPIC_API_KEY not configured. Add it to enable AI analysis.",
        optimizedQuery: rawSql,
      },
      degraded: true,
    };
  }

  try {
    const response = await callClaude(buildAnalysisPrompt(rawSql, explainOutput));
    return { response, degraded: false };
  } catch {
    try {
      const response = await callClaude(buildFallbackPrompt(rawSql));
      return { response, degraded: true };
    } catch {
      return {
        response: {
          ...EMPTY_RESPONSE,
          summary: "AI analysis failed after retry. The query was still analyzed for execution plan data.",
          optimizedQuery: rawSql,
        },
        degraded: true,
      };
    }
  }
}
