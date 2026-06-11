import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Session statuses that represent a real, published event (as opposed to a
 * draft that can still change). Used to keep drafts out of calendar exports.
 * (`scheduled` is unused in practice; `draft`/`canceled` are excluded.)
 */
export const PUBLISHED_SESSION_STATES = new Set(["published", "ended", "completed"]);

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/**
 * Resolve a "who's leading" string per session for `.ics` descriptions:
 * the session host plus its co-hosts, e.g. "Alex Mercer & Mira Hart".
 *
 * Host ids come from the caller (`app_session.host_id`); co-hosts from
 * `vw_challenge_session_team` (the public-safe view — `app_session_cohost`
 * itself is RLS-restricted and carries revenue data). Returns a map of
 * session_id → joined names; sessions with no resolvable names are omitted.
 */
export async function resolveSessionExperts(
  supabase: ServerClient,
  hostBySession: Map<string, string | null>,
): Promise<Map<string, string>> {
  const sessionIds = [...hostBySession.keys()];
  if (sessionIds.length === 0) return new Map();

  const { data: team } = await supabase
    .from("vw_challenge_session_team")
    .select("session_id, cohost_id")
    .in("session_id", sessionIds);

  const cohostsBySession = new Map<string, string[]>();
  const personIds = new Set<string>();
  for (const hid of hostBySession.values()) if (hid) personIds.add(hid);
  for (const t of (team ?? []) as Array<{ session_id: string; cohost_id: string | null }>) {
    if (!t.cohost_id) continue;
    const arr = cohostsBySession.get(t.session_id) ?? [];
    if (!arr.includes(t.cohost_id)) arr.push(t.cohost_id);
    cohostsBySession.set(t.session_id, arr);
    personIds.add(t.cohost_id);
  }

  const nameById = new Map<string, string>();
  if (personIds.size > 0) {
    const { data: profs } = await supabase
      .from("app_profile")
      .select("id, display_name")
      .in("id", [...personIds]);
    for (const p of (profs ?? []) as Array<{ id: string; display_name: string | null }>) {
      if (p.display_name) nameById.set(p.id, p.display_name);
    }
  }

  const out = new Map<string, string>();
  for (const [sid, hid] of hostBySession) {
    const names: string[] = [];
    const hostName = hid ? nameById.get(hid) : undefined;
    if (hostName) names.push(hostName);
    for (const cid of cohostsBySession.get(sid) ?? []) {
      const n = nameById.get(cid);
      if (n && !names.includes(n)) names.push(n);
    }
    if (names.length > 0) out.set(sid, joinNames(names));
  }
  return out;
}
