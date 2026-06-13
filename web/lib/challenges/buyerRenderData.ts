import { createClient } from "@/lib/supabase/server";
import { buildWeeks } from "./buildWeeks";
import { loadSessionCohosts } from "./sessionCohosts";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The challenge fields the buyer render needs. Sourced from `app_challenge`
 * directly (the preview, pre-publish) or from `vw_challenge_buyer_view` +
 * `app_challenge` raw promise/description (the post-publish page) — both
 * provide the same fields, so the assembled render is identical either way.
 */
export interface BuyerChallengeInput {
  id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  promise_text: string | null;
  description: string | null;
  weekly_arc: unknown;
  topic_ownership: unknown;
}

/**
 * Shared assembly for the buyer-page render — creators (owner + co-hosts with
 * profiles), per-week journey (sessions + host/co-host attribution), topic
 * ownership, and the hero's two-beat promise/description. Used by BOTH the
 * post-publish page and the pre-publish preview so they can never drift.
 */
export async function loadBuyerRenderData(
  supabase: ServerClient,
  challenge: BuyerChallengeInput
) {
  const { id, owner_id } = challenge;

  const rawPromise = challenge.promise_text?.trim() || null;
  const rawDescription = challenge.description?.trim() || null;
  const heroPromise = rawPromise ?? rawDescription;
  const heroDescription = rawPromise ? rawDescription : null;

  const { data: cohostRows } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id")
    .eq("challenge_id", id);
  const cohostIds: string[] = (cohostRows ?? []).map(
    (c: { cohost_id: string }) => c.cohost_id
  );

  const allCreatorIds = [owner_id, ...cohostIds];
  const { data: creatorProfiles } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url, bio, tagline, username")
    .in("id", allCreatorIds);

  const profileById = new Map<
    string,
    {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      tagline: string | null;
      username: string | null;
    }
  >();
  for (const p of creatorProfiles ?? []) {
    profileById.set((p as { id: string }).id, p as never);
  }

  const owner = profileById.get(owner_id);
  const cohostProfiles = cohostIds
    .map((cid) => profileById.get(cid))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const creators = [
    ...(owner ? [{ ...owner, role: "owner" as const }] : []),
    ...cohostProfiles.map((p) => ({ ...p, role: "cohost" as const })),
  ];

  const { data: sessionRows } = await supabase
    .from("app_challenge_session")
    .select(
      "session_id, app_session(id, title, description, image_url, start_time, duration_minutes, host_id)"
    )
    .eq("challenge_id", id);

  const sessions = ((sessionRows ?? [])
    .map((r: { app_session: unknown }) => r.app_session)
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    start_time: string;
    duration_minutes: number;
    host_id: string | null;
  }>).sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const topicsByCreator: Record<string, string[]> =
    (challenge.topic_ownership as Record<string, string[]>) ?? {};

  const weeklyArc =
    (challenge.weekly_arc as Array<{ week: number; theme: string }>) ?? [];
  const rawWeeks = buildWeeks(
    challenge.start_date,
    challenge.end_date,
    weeklyArc,
    sessions
  );
  const creatorsById = new Map(creators.map((c) => [c.id, c]));
  const cohostsBySession = await loadSessionCohosts(supabase, id, creatorsById);
  const weeks = rawWeeks.map((week) => ({
    ...week,
    sessions: week.sessions.map((s) => ({
      ...s,
      host: s.host_id ? creatorsById.get(s.host_id) ?? null : null,
      cohosts: cohostsBySession.get(s.id) ?? [],
    })),
  }));

  return { creators, topicsByCreator, weeks, sessions, heroPromise, heroDescription };
}
