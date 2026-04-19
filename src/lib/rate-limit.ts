import { createServiceClient } from "@/lib/supabase/server";

const MAX_PER_HOUR = 10;

export async function checkRateLimit(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("query_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo);

  return (count ?? 0) < MAX_PER_HOUR;
}
