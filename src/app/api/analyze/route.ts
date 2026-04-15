import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { sql } = await req.json();
  if (typeof sql !== "string" || !sql.trim()) {
    return NextResponse.json({ error: "sql required" }, { status: 400 });
  }

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
