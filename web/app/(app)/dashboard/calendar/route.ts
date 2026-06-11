import { createClient } from "@/lib/supabase/server";
import { buildICS, type ICSEvent } from "@/lib/ics";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  title: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  status: string | null;
};

/**
 * Creator hosting calendar: every session the caller is involved in hosting —
 * sessions of experiences they own or co-host, plus sessions where they're the
 * host or a session-cohost. Deduped by session id. Runs with cookie auth (RLS).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const me = user.id;

  const [{ data: owned }, { data: cohosted }] = await Promise.all([
    supabase.from("app_challenge").select("id, title").eq("owner_id", me),
    supabase.from("app_challenge_cohost").select("challenge_id").eq("cohost_id", me),
  ]);

  const titleById = new Map<string, string>();
  const challengeIds = new Set<string>();
  for (const c of (owned ?? []) as { id: string; title: string | null }[]) {
    challengeIds.add(c.id);
    if (c.title) titleById.set(c.id, c.title);
  }
  for (const c of (cohosted ?? []) as { challenge_id: string }[]) {
    challengeIds.add(c.challenge_id);
  }

  // session id → { session, owning experience title (if known) }
  const byId = new Map<string, { s: SessionRow; exp?: string }>();

  if (challengeIds.size > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("challenge_id, app_session(id, title, start_time, duration_minutes, status)")
      .in("challenge_id", Array.from(challengeIds));
    for (const row of links ?? []) {
      const r = row as {
        challenge_id: string;
        app_session: SessionRow | SessionRow[] | null;
      };
      const s = Array.isArray(r.app_session) ? r.app_session[0] : r.app_session;
      if (s?.id && !byId.has(s.id)) byId.set(s.id, { s, exp: titleById.get(r.challenge_id) });
    }
  }

  const { data: hosted } = await supabase
    .from("app_session")
    .select("id, title, start_time, duration_minutes, status")
    .eq("host_id", me);
  for (const s of (hosted ?? []) as SessionRow[]) {
    if (s.id && !byId.has(s.id)) byId.set(s.id, { s });
  }

  const { data: scoh } = await supabase
    .from("app_session_cohost")
    .select("app_session(id, title, start_time, duration_minutes, status)")
    .eq("cohost_id", me);
  for (const row of scoh ?? []) {
    const raw = (row as { app_session: SessionRow | SessionRow[] | null }).app_session;
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (s?.id && !byId.has(s.id)) byId.set(s.id, { s });
  }

  const origin = new URL(request.url).origin;
  const events: ICSEvent[] = [];
  for (const { s, exp } of byId.values()) {
    if (!s.start_time || s.status === "canceled") continue;
    events.push({
      uid: `${s.id}@infitra.fit`,
      start: new Date(s.start_time),
      durationMin: Number(s.duration_minutes) || 60,
      title: `INFITRA: ${s.title ?? "Session"}`,
      description: exp || undefined,
      url: `${origin}/dashboard`,
    });
  }
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  const ics = buildICS({ calName: "INFITRA — Your sessions", events });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="infitra-hosting.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
