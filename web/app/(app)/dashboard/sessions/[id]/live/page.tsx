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

  const { data: session } = await supabase
    .from("app_session")
    .select("id, title, host_id, live_room_id, status")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (!session) notFound();
  if (session.status === "ended") redirect(`/dashboard/sessions/${id}`);
  if (!session.live_room_id) redirect(`/dashboard/sessions/${id}`);

  return (
    <LiveRoomEmbed
      sessionId={id}
      sessionTitle={session.title}
      isHost={true}
    />
  );
}
