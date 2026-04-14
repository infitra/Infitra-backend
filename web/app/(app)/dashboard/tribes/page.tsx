import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";
import { TribeCard } from "../TribeCard";

export const metadata = {
  title: "Tribes — INFITRA",
};

export default async function TribesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // ── Tribes ──────────────────────────────────────────
  const { data: challengeSpaces } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, source_challenge_id, cover_image_url")
    .eq("owner_id", user.id);

  const challengeIds = (challengeSpaces ?? []).map((s: any) => s.source_challenge_id).filter(Boolean);

  // Challenge details
  const challengeDetails: Record<string, any> = {};
  if (challengeIds.length > 0) {
    const { data: chs } = await supabase.from("app_challenge").select("id, title, status, start_date, end_date, price_cents").in("id", challengeIds);
    for (const c of chs ?? []) challengeDetails[c.id] = c;
  }

  // Member counts
  const tribeMemberCounts: Record<string, number> = {};
  if (challengeIds.length > 0) {
    const { data: members } = await supabase.from("app_challenge_member").select("challenge_id").in("challenge_id", challengeIds);
    const c2s: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) { if (cs.source_challenge_id) c2s[cs.source_challenge_id] = cs.id; }
    for (const m of members ?? []) { const sid = c2s[m.challenge_id]; if (sid) tribeMemberCounts[sid] = (tribeMemberCounts[sid] ?? 0) + 1; }
  }

  // ── Per-tribe sessions ──────────────────────────────
  const tribeSessions: Record<string, { id: string; title: string; image_url: string | null; start_time: string }[]> = {};
  const challengeToSpace: Record<string, string> = {};
  for (const cs of challengeSpaces ?? []) {
    if (cs.source_challenge_id) challengeToSpace[cs.source_challenge_id] = cs.id;
  }

  // Fetch all upcoming sessions linked to these challenges
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, image_url, start_time, status")
    .eq("host_id", user.id)
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(50);

  const allSessionIds = (upcomingSessions ?? []).map((s: any) => s.id);
  if (allSessionIds.length > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("session_id, challenge_id")
      .in("session_id", allSessionIds);
    for (const link of links ?? []) {
      const spaceId = challengeToSpace[(link as any).challenge_id];
      if (spaceId) {
        const sess = (upcomingSessions ?? []).find((s: any) => s.id === (link as any).session_id);
        if (sess) {
          if (!tribeSessions[spaceId]) tribeSessions[spaceId] = [];
          tribeSessions[spaceId].push({
            id: sess.id,
            title: sess.title,
            image_url: sess.image_url ?? null,
            start_time: sess.start_time,
          });
        }
      }
    }
  }

  // ── Build tribe data (ALL tribes, not just active) ──
  const tribeData = (challengeSpaces ?? [])
    .map((cs: any) => {
      const ch = challengeDetails[cs.source_challenge_id] ?? {};
      return {
        id: cs.id,
        title: cs.title,
        coverImageUrl: cs.cover_image_url ?? null,
        memberCount: tribeMemberCounts[cs.id] ?? 0,
        challengeTitle: ch.title ?? "",
        challengeStatus: ch.status ?? "draft",
        challengeStartDate: ch.start_date ?? null,
        challengeEndDate: ch.end_date ?? null,
        challengePriceCents: ch.price_cents ?? 0,
        nextSessions: tribeSessions[cs.id] ?? [],
      };
    })
    .filter((t) => t.challengeStatus === "published")
    .sort((a, b) => {
      const aNext = a.nextSessions[0]?.start_time;
      const bNext = b.nextSessions[0]?.start_time;
      if (!aNext && !bNext) return 0;
      if (!aNext) return 1;
      if (!bNext) return -1;
      return new Date(aNext).getTime() - new Date(bNext).getTime();
    });

  const totalMembers = tribeData.reduce((a, t) => a + t.memberCount, 0);

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 rounded-full" style={{ backgroundColor: "#FF6130" }} />
          <h1 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight">
            Your Tribes
          </h1>
        </div>
        <form action={createDraftChallenge}>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full text-white text-xs font-black font-headline uppercase tracking-widest"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
          >
            + Create
          </button>
        </form>
      </div>
      <p className="text-sm text-[#94a3b8] mb-8 ml-[19px]">
        {tribeData.length} tribe{tribeData.length !== 1 ? "s" : ""} · {totalMembers} member{totalMembers !== 1 ? "s" : ""}
      </p>

      {tribeData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tribeData.map((tribe) => (
            <TribeCard key={tribe.id} tribe={tribe} fullWidth />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl infitra-card p-10 text-center">
          <h2 className="text-lg font-black font-headline text-[#0F2229] mb-2">Create your first tribe</h2>
          <p className="text-sm text-[#94a3b8] max-w-md mx-auto mb-6">
            Publish a challenge and a tribe is born — a space where participants engage freely and grow together.
          </p>
          <form action={createDraftChallenge} className="inline-block">
            <button
              type="submit"
              className="px-6 py-3 rounded-full text-white text-sm font-black font-headline"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
            >
              + Create Challenge
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
