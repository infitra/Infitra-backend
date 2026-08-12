import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LiveRoomEmbed } from "@/app/components/LiveRoomEmbed";

export const metadata = {
  title: "Live Session — INFITRA",
};

export default async function ParticipantLivePage({
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

  const { data: session } = await supabase
    .from("app_session")
    .select("id, title, host_id, live_room_id, status")
    .eq("id", id)
    .single();

  if (!session) notFound();

  // Resolve the parent challenge so we can return the participant to the
  // Experience Space (their home for this program), not the retired session page.
  const { data: link } = await supabase
    .from("app_challenge_session")
    .select("challenge_id")
    .eq("session_id", id)
    .maybeSingle();
  const backHref = link?.challenge_id ? `/experiences/${link.challenge_id}/space` : "/me";

  if (session.status === "ended") redirect(backHref);
  if (!session.live_room_id) redirect(backHref);

  // Entitlement guard (edge function does authoritative check, this is UX
  // guard). The expert TEAM counts, not just the host: is_session_expert
  // (host / session cohost / challenge owner / challenge cohost) is the
  // same shared definition issue_join_token and end_session enforce. An
  // expert here gets the expert controls — either expert can End.
  let isExpert = user.id === session.host_id;
  if (!isExpert) {
    const { data: expert } = await supabase.rpc("is_session_expert", {
      p_session_id: id,
      p_user_id: user.id,
    });
    isExpert = expert === true;
  }
  if (!isExpert) {
    // app_attendance has NO id column (composite key session_id+user_id).
    // Selecting "id" here made PostgREST error, data came back null, and
    // EVERY participant on EVERY device was silently bounced back to the
    // space — the "mobile join failure" that was never mobile at all.
    // Hosts skipped this branch, which is why demos always worked.
    const { data: attendance, error: attErr } = await supabase
      .from("app_attendance")
      .select("session_id")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    // A QUERY failure must not read as "not entitled": issue_join_token is
    // the authoritative check; let the room page make the call visible.
    if (!attendance && !attErr) redirect(backHref);
  }

  return (
    <LiveRoomEmbed
      sessionId={id}
      sessionTitle={session.title}
      isHost={isExpert}
      backHref={backHref}
    />
  );
}
