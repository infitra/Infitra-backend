import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LiveRoomEmbed } from "@/app/components/LiveRoomEmbed";

export const metadata = {
  title: "Live Session — INFITRA",
};

export default async function HostLivePage({
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

  // The expert TEAM enters here, not just the host: filtering on host_id
  // 404'd a co-expert or challenge owner routed in by their own dashboard
  // (rehearsal finding, 11 Aug). is_session_expert is the shared
  // definition every live endpoint enforces.
  const { data: session } = await supabase
    .from("app_session")
    .select("id, title, host_id, live_room_id, status")
    .eq("id", id)
    .single();

  if (!session) notFound();

  let isExpert = session.host_id === user.id;
  if (!isExpert) {
    const { data: expert } = await supabase.rpc("is_session_expert", {
      p_session_id: id,
      p_user_id: user.id,
    });
    isExpert = expert === true;
  }
  if (!isExpert) notFound();

  // Resolve the parent challenge so we can return the host to the collaboration
  // workspace, not the retired dashboard session page.
  const { data: link } = await supabase
    .from("app_challenge_session")
    .select("challenge_id")
    .eq("session_id", id)
    .maybeSingle();
  const backHref = link?.challenge_id ? `/dashboard/collaborate/${link.challenge_id}` : "/dashboard";

  if (session.status === "ended") redirect(backHref);
  if (!session.live_room_id) redirect(backHref);

  return (
    <LiveRoomEmbed
      sessionId={id}
      sessionTitle={session.title}
      isHost={true}
      backHref={backHref}
    />
  );
}
