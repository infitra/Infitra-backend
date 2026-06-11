import { createClient } from "@/lib/supabase/server";
import { buildICS, type ICSEvent } from "@/lib/ics";
import {
  resolveSessionExperts,
  PUBLISHED_SESSION_STATES,
} from "@/lib/challenges/sessionExperts";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  title: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  status: string | null;
  host_id: string | null;
};

/**
 * Creator hosting calendar: every PUBLISHED session the caller is involved in
 * hosting — sessions of experiences they own or co-host, plus sessions where
 * they're the host or a session-cohost. Drafts are excluded (they can still
 * change). Deduped by session id. Runs with cookie auth (RLS).
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
      .select("challenge_id, app_session(id, title, start_time, duration_minutes, status, host_id)")
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
    .select("id, title, start_time, duration_minutes, status, host_id")
    .eq("host_id", me);
  for (const s of (hosted ?? []) as SessionRow[]) {
    if (s.id && !byId.has(s.id)) byId.set(s.id, { s });
  }

  const { data: scoh } = await supabase
    .from("app_session_cohost")
    .select("app_session(id, title, start_time, duration_minutes, status, host_id)")
    .eq("cohost_id", me);
  for (const row of scoh ?? []) {
    const raw = (row as { app_session: SessionRow | SessionRow[] | null }).app_session;
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (s?.id && !byId.has(s.id)) byId.set(s.id, { s });
  }

  // Only export published events — drafts can still change at any time.
  const usable = [...byId.values()].filter(
    ({ s }) => s.start_time && PUBLISHED_SESSION_STATES.has(s.status ?? "")
  );

  const experts = await resolveSessionExperts(
    supabase,
    new Map(usable.map(({ s }) => [s.id, s.host_id ?? null]))
  );

  const origin = new URL(request.url).origin;
  const events: ICSEvent[] = usable.map(({ s, exp }) => {
    const who = experts.get(s.id);
    const descParts = [who ? `With ${who}` : null, exp ?? null].filter(Boolean) as string[];
    return {
      uid: `${s.id}@infitra.fit`,
      start: new Date(s.start_time as string),
      durationMin: Number(s.duration_minutes) || 60,
      title: `INFITRA: ${s.title ?? "Session"}`,
      description: descParts.length > 0 ? descParts.join(" · ") : undefined,
      url: `${origin}/dashboard`,
    };
  });
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
