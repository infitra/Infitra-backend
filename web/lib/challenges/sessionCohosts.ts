import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface SessionPersonLite {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "cohost";
}

/**
 * Per-session cohosts for the buyer page, keyed by session id.
 *
 * Read from vw_challenge_session_team (a public-safe view) rather than
 * app_session_cohost directly: that base table is RLS-restricted to the
 * session host/cohost themselves and carries split_percent (revenue
 * data), so it cannot be read on a public page. The view exposes only
 * identity columns (session_id, host_id, cohost_id) for published/
 * completed challenges.
 *
 * Profiles are resolved from creatorsById where possible (owner +
 * challenge cohosts, already loaded by the page); any session cohost who
 * isn't a challenge-level creator is fetched and defaulted to "cohost".
 */
export async function loadSessionCohosts(
  supabase: ServerClient,
  challengeId: string,
  creatorsById: ReadonlyMap<string, SessionPersonLite>,
): Promise<Map<string, SessionPersonLite[]>> {
  const { data: teamRows } = await supabase
    .from("vw_challenge_session_team")
    .select("session_id, cohost_id")
    .eq("challenge_id", challengeId);

  const cohostIdsBySession = new Map<string, string[]>();
  const missing = new Set<string>();
  for (const t of (teamRows ?? []) as Array<{
    session_id: string;
    cohost_id: string | null;
  }>) {
    if (!t.cohost_id) continue;
    const arr = cohostIdsBySession.get(t.session_id) ?? [];
    if (!arr.includes(t.cohost_id)) arr.push(t.cohost_id);
    cohostIdsBySession.set(t.session_id, arr);
    if (!creatorsById.has(t.cohost_id)) missing.add(t.cohost_id);
  }

  const resolved = new Map<string, SessionPersonLite>(creatorsById);
  if (missing.size > 0) {
    const { data: profs } = await supabase
      .from("app_profile")
      .select("id, display_name, avatar_url")
      .in("id", [...missing]);
    for (const p of (profs ?? []) as Array<{
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }>) {
      resolved.set(p.id, {
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        role: "cohost",
      });
    }
  }

  const out = new Map<string, SessionPersonLite[]>();
  for (const [sessionId, ids] of cohostIdsBySession) {
    out.set(
      sessionId,
      ids
        .map((id) => resolved.get(id))
        .filter((p): p is SessionPersonLite => !!p),
    );
  }
  return out;
}
