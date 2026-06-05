import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Session — INFITRA",
};

/**
 * The standalone session page is retired. A session now lives inside its
 * Experience: members land in the Experience Space (which itself redirects
 * non-members to the public experience page, where they can purchase).
 *
 * This stub keeps every old inbound link working — the live-room exit, the
 * live page's ended/no-entitlement redirects, and any shared URL — by bouncing
 * to the modern surface instead of rendering the old detail page. The live
 * room itself stays at /sessions/[id]/live.
 */
export default async function SessionPage({
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

  if (link?.challenge_id) redirect(`/experiences/${link.challenge_id}/space`);
  redirect("/me");
}
