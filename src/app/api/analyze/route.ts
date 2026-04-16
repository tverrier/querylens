import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

const AnalyzeSchema = z.object({
  sql: z.string().trim().min(1, "sql required").max(50_000),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = AnalyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }
  const { sql } = parsed.data;

  const { data, error } = await supabase
    .from("query_analyses")
    .insert({ user_id: user.id, raw_sql: sql, status: "pending" })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
  }

  await inngest.send({
    name: "query/analyze.requested",
    data: { analysisId: data.id, userId: user.id, rawSql: sql },
  });

  return NextResponse.json({ id: data.id });
}
