import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { ExperienceSpaceShell } from "./ExperienceSpaceShell";
import { mapSnapshot, type RawExperienceSpaceSnapshot } from "@/lib/experienceSpace/mapSnapshot";

export const metadata = { title: "Experience Space — INFITRA" };
export const dynamic = "force-dynamic";

export default async function ExperienceSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // One consolidated round-trip (load_experience_space).
  const { data, error } = await supabase.rpc("load_experience_space", {
    p_challenge_id: id,
  });
  const seed = mapSnapshot(data as RawExperienceSpaceSnapshot | null, user.id);

  // Not authorized / no space yet → send to the Experience's public buyer page
  // so a non-member can see the offer and join (an enrolled user landing there
  // is redirected straight back into this space). This also covers the brief
  // window where a just-paid buyer arrives before the stripe webhook has
  // written their membership — they see the offer, not the creator dashboard.
  if (error || !seed) redirect(`/experiences/${id}`);

  // Creators get an at-a-glance console; fetch its numbers server-side so they
  // render on first paint (no client round-trip, no "needs a refresh"). Cheap,
  // creators only; the RPC self-authorizes so a non-creator just gets null.
  let initialCreatorStats: { pending: number; reflections: number } | null = null;
  if (seed.isCreator) {
    const { data: cs } = await supabase.rpc("load_experience_creator_stats", {
      p_challenge_id: id,
    });
    const c = cs as
      | { authorized?: boolean; pending_questions?: number; recent_reflections?: number }
      | null;
    if (c?.authorized) {
      initialCreatorStats = {
        pending: c.pending_questions ?? 0,
        reflections: c.recent_reflections ?? 0,
      };
    }
  }

  // Creator-only continuation signal: the next run in this lineage (if any) and
  // whether this run has started — you continue a running/wrapped experience, not
  // an upcoming one. Drives the "Next chapter" console action. (continued_from
  // children are own/visible drafts + published siblings, so RLS allows the read.)
  let continuation:
    | { status: string; nextRunId: string | null; nextRunStart: string | null }
    | null = null;
  if (seed.isCreator && seed.experience.startDate <= new Date().toISOString().split("T")[0]) {
    const { data: nextRun } = await supabase
      .from("app_challenge")
      .select("id, status, start_date")
      .eq("continued_from_challenge_id", id)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nr = nextRun as { id: string; status: string; start_date: string } | null;
    continuation = {
      status: nr?.status ?? "none",
      nextRunId: nr?.id ?? null,
      nextRunStart: nr?.start_date ?? null,
    };
  }

  const { data: prof } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  // Review state (H3c) — post-experience prompts in the Space.
  // experience_review_open gates both the participant experience-review card
  // and the creator collab-review card; the rest say what the viewer's rated.
  const { data: reviewOpenRaw } = await supabase.rpc("experience_review_open", {
    p_challenge: id,
  });
  const reviewOpen = reviewOpenRaw === true;
  let reviewState: {
    open: boolean;
    hasExperienceReview: boolean;
    reviewedSubjectIds: string[];
  } = { open: reviewOpen, hasExperienceReview: false, reviewedSubjectIds: [] };
  if (reviewOpen) {
    const [{ data: myExpReview }, { data: myCollabRows }] = await Promise.all([
      supabase
        .from("app_review")
        .select("id")
        .eq("challenge_id", id)
        .eq("reviewer_id", user.id)
        .maybeSingle(),
      supabase
        .from("app_collab_review")
        .select("subject_id")
        .eq("challenge_id", id)
        .eq("reviewer_id", user.id),
    ]);
    reviewState = {
      open: true,
      hasExperienceReview: !!myExpReview,
      reviewedSubjectIds: (myCollabRows ?? []).map(
        (r) => (r as { subject_id: string }).subject_id
      ),
    };
  }

  return (
    <div className="min-h-screen">
      <ParticipantNav displayName={prof?.display_name ?? null} role={prof?.role} />
      <div className="pt-20">
        <ExperienceSpaceShell seed={seed} initialCreatorStats={initialCreatorStats} reviewState={reviewState} continuation={continuation} />
      </div>
    </div>
  );
}
