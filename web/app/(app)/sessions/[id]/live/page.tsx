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

  // Entitlement guard (edge function does authoritative check, this is UX guard)
  const isHost = user.id === session.host_id;
  if (!isHost) {
    const { data: attendance } = await supabase
      .from("app_attendance")
      .select("id")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!attendance) redirect(backHref);
  }

  return (
    <LiveRoomEmbed
      sessionId={id}
      sessionTitle={session.title}
      isHost={isHost}
      backHref={backHref}
    />
  );
}
