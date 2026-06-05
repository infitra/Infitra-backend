import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Session — INFITRA",
};

/**
 * The standalone dashboard session page is retired. Session management now
 * lives in the collaboration workspace (it has the session detail modal + the
 * edit flow). This stub bounces old inbound links — top alerts, session
 * notifications, the live-room exit, and "prepare session" / session-card
 * links — to that workspace. Going live still uses the dedicated
 * /dashboard/sessions/[id]/live route.
 */
export default async function DashboardSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: link } = await supabase
    .from("app_challenge_session")
    .select("challenge_id")
    .eq("session_id", id)
    .maybeSingle();

  if (link?.challenge_id) redirect(`/dashboard/collaborate/${link.challenge_id}`);
  redirect("/dashboard");
}
