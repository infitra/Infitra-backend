import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";
import { CollabInviteFlow } from "./CollabInviteFlow";

export const metadata = {
  title: "Create — INFITRA",
};

/**
 * "Meaningful" draft = the user has done at least one piece of real
 * work on it (named it, described it, picked a cover, added a session,
 * or invited a cohost). Anything less is noise — usually an accidental
 * tab open. We hide noise from the list AND clean it from the DB after
 * a 30-minute grace period (see cleanupEmptyDrafts).
 */
function isMeaningfulDraft(d: {
  title: string;
  description: string | null;
  image_url: string | null;
  hasSessions: boolean;
  hasCohosts: boolean;
}) {
  return (
    d.title.trim() !== "Untitled Challenge" ||
    (d.description?.trim().length ?? 0) > 0 ||
    !!d.image_url ||
    d.hasSessions ||
    d.hasCohosts
  );
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function CreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Cleanup: prune the user's empty drafts older than 30 minutes ──
  // Surgically safe — every "no work was done" condition has to hold.
  // 30-min grace covers accidental tab closes.
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: cleanupCandidates } = await supabase
    .from("app_challenge")
    .select("id, description")
    .eq("owner_id", user.id)
    .eq("status", "draft")
    .eq("title", "Untitled Challenge")
    .is("image_url", null)
    .lt("created_at", thirtyMinAgo);

  if (cleanupCandidates && cleanupCandidates.length > 0) {
    const candidateIds = cleanupCandidates
      .filter((c: any) => !c.description || c.description.trim().length === 0)
      .map((c: any) => c.id);

    if (candidateIds.length > 0) {
      // Verify no sessions or cohosts before deleting
      const [{ data: hasSessions }, { data: hasCohosts }] = await Promise.all([
        supabase.from("app_challenge_session").select("challenge_id").in("challenge_id", candidateIds),
        supabase.from("app_challenge_cohost").select("challenge_id").in("challenge_id", candidateIds),
      ]);
      const sessionIds = new Set((hasSessions ?? []).map((r: any) => r.challenge_id));
      const cohostIds = new Set((hasCohosts ?? []).map((r: any) => r.challenge_id));
      const trulyEmpty = candidateIds.filter((id) => !sessionIds.has(id) && !cohostIds.has(id));
      if (trulyEmpty.length > 0) {
        await supabase.from("app_challenge").delete().in("id", trulyEmpty);
      }
    }
  }

  // ── Profile (for the personalized CTA cards) ──────────────────
  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const userInitial = profile?.display_name?.[0]?.toUpperCase() ?? "?";
  const userAvatar = profile?.avatar_url ?? null;

  // ── Owned drafts (with extra fields for filtering + display) ──
  const { data: rawOwned } = await supabase
    .from("app_challenge")
    .select("id, title, description, image_url, created_at")
    .eq("owner_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  const ownedIds = (rawOwned ?? []).map((d: any) => d.id);

  // Session counts
  const sessionCounts: Record<string, number> = {};
  if (ownedIds.length > 0) {
    const { data: rows } = await supabase
      .from("app_challenge_session")
      .select("challenge_id")
      .in("challenge_id", ownedIds);
    for (const r of rows ?? []) {
      const id = (r as any).challenge_id;
      sessionCounts[id] = (sessionCounts[id] ?? 0) + 1;
    }
  }

  // Cohosts on owned drafts
  const cohostMap: Record<string, string[]> = {};
  if (ownedIds.length > 0) {
    const { data: rows } = await supabase
      .from("app_challenge_cohost")
      .select("challenge_id, cohost_id")
      .in("challenge_id", ownedIds);
    for (const c of rows ?? []) {
      const id = (c as any).challenge_id;
      cohostMap[id] = cohostMap[id] ?? [];
      cohostMap[id].push((c as any).cohost_id);
    }
  }

  // Cohost profile lookup (for displaying partner avatars on cards)
  const allPartnerIds = [...new Set(Object.values(cohostMap).flat())];
  const partnerProfiles: Record<string, { name: string; avatar: string | null }> = {};
  if (allPartnerIds.length > 0) {
    const { data: profs } = await supabase
      .from("app_profile")
      .select("id, display_name, avatar_url")
      .in("id", allPartnerIds);
    for (const p of profs ?? [])
      partnerProfiles[(p as any).id] = {
        name: (p as any).display_name ?? "Creator",
        avatar: (p as any).avatar_url,
      };
  }

  // Filter owned drafts to meaningful ones only
  const ownedDrafts = (rawOwned ?? [])
    .map((d: any) => ({
      ...d,
      sessionCount: sessionCounts[d.id] ?? 0,
      cohostIds: cohostMap[d.id] ?? [],
      role: "owner" as const,
    }))
    .filter((d) =>
      isMeaningfulDraft({
        title: d.title,
        description: d.description,
        image_url: d.image_url,
        hasSessions: d.sessionCount > 0,
        hasCohosts: d.cohostIds.length > 0,
      }),
    );

  // ── Cohost drafts (collabs the user was invited to) ──
  const { data: cohostLinks } = await supabase
    .from("app_challenge_cohost")
    .select("challenge_id, app_challenge(id, title, description, image_url, owner_id, status, created_at)")
    .eq("cohost_id", user.id);

  const cohostDraftRecords = (cohostLinks ?? [])
    .filter((l: any) => l.app_challenge?.status === "draft")
    .map((l: any) => l.app_challenge);

  // Session counts on cohost drafts
  const cohostDraftIds = cohostDraftRecords.map((c: any) => c.id);
  const cohostSessionCounts: Record<string, number> = {};
  if (cohostDraftIds.length > 0) {
    const { data: rows } = await supabase
      .from("app_challenge_session")
      .select("challenge_id")
      .in("challenge_id", cohostDraftIds);
    for (const r of rows ?? []) {
      const id = (r as any).challenge_id;
      cohostSessionCounts[id] = (cohostSessionCounts[id] ?? 0) + 1;
    }
  }

  // Owner profile lookup for cohost drafts (so we can show "with X")
  const cohostOwnerIds = [...new Set(cohostDraftRecords.map((c: any) => c.owner_id))];
  const ownerProfiles: Record<string, { name: string; avatar: string | null }> = {};
  if (cohostOwnerIds.length > 0) {
    const { data: profs } = await supabase
      .from("app_profile")
      .select("id, display_name, avatar_url")
      .in("id", cohostOwnerIds);
    for (const p of profs ?? [])
      ownerProfiles[(p as any).id] = {
        name: (p as any).display_name ?? "Creator",
        avatar: (p as any).avatar_url,
      };
  }

  const cohostDrafts = cohostDraftRecords.map((c: any) => ({
    ...c,
    sessionCount: cohostSessionCounts[c.id] ?? 0,
    role: "cohost" as const,
    partner: ownerProfiles[c.owner_id] ?? null,
  }));

  // Combined draft list
  const allDrafts = [...ownedDrafts, ...cohostDrafts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <div className="py-6">
      {/* ── HERO HEADER ──────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#FF6130" }} />
          <h1
            className="text-3xl md:text-4xl font-headline tracking-tight"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Create
          </h1>
        </div>
        <p className="text-base text-[#64748b] ml-[19px] max-w-xl">
          Start a new live program. Build it solo, or co-create with other experts.
        </p>
      </div>

      {/* ── TWO PATHS — visual scene cards ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {/* Collaboration — primary (orange) */}
        <div
          className="rounded-2xl overflow-hidden infitra-card"
          style={{ border: "1px solid rgba(255,97,48,0.30)" }}
        >
          <div
            className="h-1.5"
            style={{ background: "linear-gradient(90deg, #FF6130, rgba(255,97,48,0.30))" }}
          />
          <div className="p-6">
            {/* Mini scene: the creator + an invited expert (dashed placeholder) */}
            <div className="flex items-center -space-x-2 mb-5">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover relative z-10"
                  style={{ border: "2px solid #FFFFFF" }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center relative z-10"
                  style={{ border: "2px solid #FFFFFF", backgroundColor: "rgba(255,97,48,0.18)" }}
                >
                  <span className="text-sm font-black font-headline" style={{ color: "#FF6130" }}>
                    {userInitial}
                  </span>
                </div>
              )}
              {/* Dashed placeholder = "to be invited" */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  border: "2px dashed rgba(255,97,48,0.45)",
                  backgroundColor: "rgba(255,97,48,0.04)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6130" strokeWidth={2.2} strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </div>

            <h2
              className="text-lg md:text-xl font-headline tracking-tight mb-1.5"
              style={{ color: "#0F2229", fontWeight: 700 }}
            >
              Start Collaboration
            </h2>
            <p className="text-sm text-[#64748b] mb-4">
              Co-create with other experts. Sell as one program. Split revenue
              cleanly.
            </p>

            {/* Value pills — system features the path gives you */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {["Signed contracts", "Automated splits", "Shared workspace"].map((v) => (
                <span
                  key={v}
                  className="text-[10px] uppercase tracking-widest font-headline px-2.5 py-1 rounded-full"
                  style={{
                    color: "#0891b2",
                    backgroundColor: "rgba(8,145,178,0.08)",
                    border: "1px solid rgba(8,145,178,0.20)",
                    fontWeight: 700,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>

            <CollabInviteFlow primary />
          </div>
        </div>

        {/* Solo — secondary (cyan) */}
        <div
          className="rounded-2xl overflow-hidden infitra-card"
          style={{ border: "1px solid rgba(8,145,178,0.20)" }}
        >
          <div
            className="h-1.5"
            style={{ background: "linear-gradient(90deg, #9CF0FF, rgba(156,240,255,0.30))" }}
          />
          <div className="p-6">
            {/* Mini scene: just the creator */}
            <div className="flex items-center mb-5">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                  style={{
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 2px 6px rgba(15,34,41,0.10)",
                  }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    border: "2px solid #FFFFFF",
                    backgroundColor: "rgba(8,145,178,0.18)",
                    boxShadow: "0 2px 6px rgba(15,34,41,0.10)",
                  }}
                >
                  <span className="text-sm font-black font-headline" style={{ color: "#0891b2" }}>
                    {userInitial}
                  </span>
                </div>
              )}
            </div>

            <h2
              className="text-lg md:text-xl font-headline tracking-tight mb-1.5"
              style={{ color: "#0F2229", fontWeight: 700 }}
            >
              Solo Challenge
            </h2>
            <p className="text-sm text-[#64748b] mb-4">
              Build and run a program on your own. You keep 100% of the
              creator share.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {["100% creator share", "Full ownership", "Same workspace"].map((v) => (
                <span
                  key={v}
                  className="text-[10px] uppercase tracking-widest font-headline px-2.5 py-1 rounded-full"
                  style={{
                    color: "#0891b2",
                    backgroundColor: "rgba(8,145,178,0.08)",
                    border: "1px solid rgba(8,145,178,0.20)",
                    fontWeight: 700,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>

            <form action={createDraftChallenge}>
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-sm font-black font-headline w-full"
                style={{
                  color: "#0891b2",
                  border: "2px solid #9CF0FF",
                  backgroundColor: "rgba(156,240,255,0.10)",
                }}
              >
                + Start Solo
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── DRAFTS — only shown if any meaningful drafts exist ── */}
      {allDrafts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <p
              className="text-[10px] uppercase tracking-[0.25em] font-headline shrink-0"
              style={{ color: "#94a3b8", fontWeight: 700 }}
            >
              In Progress
            </p>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.08)" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allDrafts.map((draft: any) => {
              const isCollab = draft.role === "cohost" || (draft.cohostIds?.length ?? 0) > 0;
              const partner =
                draft.role === "cohost"
                  ? draft.partner
                  : draft.cohostIds?.[0]
                    ? partnerProfiles[draft.cohostIds[0]]
                    : null;
              const isUntitled = draft.title === "Untitled Challenge";

              return (
                <Link
                  key={draft.id}
                  href={`/dashboard/collaborate/${draft.id}`}
                  className="group flex items-center gap-4 p-4 rounded-2xl infitra-card-link"
                >
                  {/* Cover thumbnail (or branded gradient placeholder) */}
                  {draft.image_url ? (
                    <img
                      src={draft.image_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center"
                      style={{
                        background: isCollab
                          ? "linear-gradient(135deg, rgba(255,97,48,0.20), rgba(8,145,178,0.20))"
                          : "linear-gradient(135deg, rgba(255,97,48,0.18), rgba(255,97,48,0.06))",
                      }}
                    >
                      <span
                        className="text-xl font-black font-headline"
                        style={{ color: isCollab ? "#0891b2" : "#FF6130" }}
                      >
                        {(isUntitled ? "?" : draft.title?.[0] ?? "?").toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm md:text-[15px] font-headline truncate group-hover:text-[#FF6130] transition-colors"
                      style={{
                        color: "#0F2229",
                        fontWeight: 700,
                        fontStyle: isUntitled ? "italic" : "normal",
                        opacity: isUntitled ? 0.7 : 1,
                      }}
                    >
                      {isUntitled ? "Untitled" : draft.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                      <span
                        className="font-bold font-headline"
                        style={{ color: isCollab ? "#0891b2" : "#94a3b8" }}
                      >
                        {isCollab
                          ? `Collab${partner?.name ? ` · with ${partner.name}` : ""}`
                          : "Solo"}
                      </span>
                      {draft.sessionCount > 0 && (
                        <>
                          <span className="text-[#94a3b8]">·</span>
                          <span className="text-[#94a3b8]">
                            {draft.sessionCount} session{draft.sessionCount !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                      <span className="text-[#94a3b8]">·</span>
                      <span className="text-[#94a3b8]">{formatRelativeTime(draft.created_at)}</span>
                    </div>
                  </div>

                  {/* Continue chevron */}
                  <span className="text-[10px] font-bold font-headline text-[#FF6130] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    Continue →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
