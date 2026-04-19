import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { validateQuery } from "@/lib/sql/sandbox";
import { checkRateLimit } from "@/lib/rate-limit";

const AnalyzeSchema = z.object({
  sql: z.string().trim().min(1, "sql required").max(10_000, "Query exceeds 10k character limit"),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rateLimitOk = await checkRateLimit(user.id);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "Rate limit exceeded (10 analyses per hour)" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AnalyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }
  const gate = validateQuery(parsed.data.sql);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 400 });
  }
  const sql = gate.sql;

  const { data, error } = await supabase
    .from("query_analyses")
    .insert({ user_id: user.id, raw_sql: sql, status: "pending" })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
  }

  try {
    await inngest.send({
      name: "analyze/query.submitted",
      data: { analysisId: data.id, userId: user.id, rawSql: sql },
    });
  } catch (err) {
    await supabase
      .from("query_analyses")
      .update({ status: "error", error_message: "Failed to start analysis pipeline. Is Inngest running?" })
      .eq("id", data.id);
    return NextResponse.json(
      { id: data.id, warning: "Analysis created but pipeline failed to start" },
      { status: 202 },
    );
  }

  return NextResponse.json({ id: data.id });
}
