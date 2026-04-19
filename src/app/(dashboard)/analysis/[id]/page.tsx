import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AnalysisView from "./analysis-view";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("query_analyses")
    .select("*, share_token")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();

  return <AnalysisView initial={data} />;
}
