import Anthropic from "@anthropic-ai/sdk";

export type ClaudeAnalysis = {
  explanation: string;
  bottlenecks: string[];
  optimized: string;
  estimated_improvement: string;
  index_suggestions: string[];
  planner_insights: string;
};

const SYSTEM_PROMPT =
  "You are a SQL performance expert. Given a query and its EXPLAIN output, respond with ONLY valid JSON matching this shape: " +
  '{"explanation": string, "bottlenecks": string[], "optimized": string, "estimated_improvement": string, "index_suggestions": string[], "planner_insights": string}. ' +
  "explanation: plain-English summary of what the query does. " +
  "bottlenecks: ordered list of performance issues found in the plan. " +
  "optimized: a rewritten SQL query. " +
  "estimated_improvement: e.g. '2-5x faster'. " +
  "index_suggestions: CREATE INDEX statements or empty array. " +
  "planner_insights: notes on planner choices (join order, scan types).";

export async function analyzeWithClaude(
  rawSql: string,
  explainOutput: unknown,
): Promise<ClaudeAnalysis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      explanation: "ANTHROPIC_API_KEY not configured. Add it to enable AI analysis.",
      bottlenecks: [],
      optimized: rawSql,
      estimated_improvement: "",
      index_suggestions: [],
      planner_insights: "",
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `SQL:\n${rawSql}\n\nEXPLAIN:\n${JSON.stringify(explainOutput)}`,
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  const json = jsonStart >= 0 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : "{}";
  const parsed = JSON.parse(json) as Partial<ClaudeAnalysis>;

  return {
    explanation: parsed.explanation ?? "",
    bottlenecks: parsed.bottlenecks ?? [],
    optimized: parsed.optimized ?? rawSql,
    estimated_improvement: parsed.estimated_improvement ?? "",
    index_suggestions: parsed.index_suggestions ?? [],
    planner_insights: parsed.planner_insights ?? "",
  };
}
