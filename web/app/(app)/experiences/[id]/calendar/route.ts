import { createClient } from "@/lib/supabase/server";
import { buildICS, slugify, type ICSEvent } from "@/lib/ics";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  title: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  status: string | null;
};

/**
 * Participant calendar export for ONE experience: the sessions of the
 * experience the caller is enrolled in, as a downloadable `.ics`.
 * Member-gated; runs with the caller's cookie auth so RLS applies.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Entitlement gate: must be enrolled in this experience.
  const { data: member } = await supabase
    .from("app_challenge_member")
    .select("challenge_id")
    .eq("challenge_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return new Response("Forbidden", { status: 403 });

  const { data: exp } = await supabase
    .from("app_challenge")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  const expTitle = (exp?.title as string | undefined) ?? "Experience";

  const { data: links } = await supabase
    .from("app_challenge_session")
    .select("app_session(id, title, start_time, duration_minutes, status)")
    .eq("challenge_id", id);

  const origin = new URL(request.url).origin;
  const spaceUrl = `${origin}/experiences/${id}/space`;

  const events: ICSEvent[] = [];
  for (const row of links ?? []) {
    const raw = (row as { app_session: SessionRow | SessionRow[] | null }).app_session;
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (!s || !s.start_time || s.status === "canceled") continue;
    events.push({
      uid: `${s.id}@infitra.fit`,
      start: new Date(s.start_time),
      durationMin: Number(s.duration_minutes) || 60,
      title: `${s.title ?? "Session"} · ${expTitle}`,
      description: `Join in your Experience Space: ${spaceUrl}`,
      url: spaceUrl,
    });
  }
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  const ics = buildICS({ calName: expTitle, events });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="infitra-${slugify(expTitle)}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
