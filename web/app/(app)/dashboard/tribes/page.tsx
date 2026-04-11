import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";

export const metadata = {
  title: "Tribes — INFITRA",
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffMin < 0) return "Now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffH < 24) return `${diffH}h`;
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function TribesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();

  // Tribes
  const { data: challengeSpaces } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, source_challenge_id")
    .eq("owner_id", user.id);

  // Member counts
  const tribeMemberCounts: Record<string, number> = {};
  const challengeIds = (challengeSpaces ?? []).map((s: any) => s.source_challenge_id).filter(Boolean);
  if (challengeIds.length > 0) {
    const { data: members } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .in("challenge_id", challengeIds);
    const c2s: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) {
      if (cs.source_challenge_id) c2s[cs.source_challenge_id] = cs.id;
    }
    for (const m of members ?? []) {
      const sid = c2s[m.challenge_id];
      if (sid) tribeMemberCounts[sid] = (tribeMemberCounts[sid] ?? 0) + 1;
    }
  }

  // Challenge titles
  const challengeTitleMap: Record<string, string> = {};
  if (challengeIds.length > 0) {
    const { data: chs } = await supabase.from("app_challenge").select("id, title").in("id", challengeIds);
    for (const c of chs ?? []) challengeTitleMap[c.id] = c.title;
  }

  // Next session per tribe
  const tribeNextSessions: Record<string, any> = {};
  if (challengeIds.length > 0) {
    const c2s: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) {
      if (cs.source_challenge_id) c2s[cs.source_challenge_id] = cs.id;
    }
    const { data: tsLinks } = await supabase
      .from("app_challenge_session")
      .select("challenge_id, app_session(id, title, start_time, status)")
      .in("challenge_id", challengeIds);
    for (const link of tsLinks ?? []) {
      const sess = (link as any).app_session;
      if (!sess || sess.status !== "published" || new Date(sess.start_time) < now) continue;
      const spaceId = c2s[(link as any).challenge_id];
      if (spaceId && (!tribeNextSessions[spaceId] || new Date(sess.start_time) < new Date(tribeNextSessions[spaceId].start_time))) {
        tribeNextSessions[spaceId] = sess;
      }
    }
  }

  // Latest post per tribe
  const tribeLatestPosts: Record<string, any> = {};
  for (const cs of challengeSpaces ?? []) {
    const { data: posts } = await supabase
      .from("app_challenge_post")
      .select("id, body, created_at, author_id")
      .eq("space_id", cs.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (posts && posts.length > 0) {
      tribeLatestPosts[cs.id] = posts[0];
    }
  }

  // Author names for latest posts
  const authorIds = [...new Set(Object.values(tribeLatestPosts).map((p: any) => p.author_id))];
  const authorNames: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("app_profile")
      .select("id, display_name")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      authorNames[p.id] = p.display_name ?? "User";
    }
  }

  const hasTribes = (challengeSpaces ?? []).length > 0;
  const tribeCount = challengeSpaces?.length ?? 0;
  const totalMembers = Object.values(tribeMemberCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Dark overlay at 88% — waves hinted at subtly against dark */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: "rgba(15, 34, 41, 0.88)" }} />

      <div className="relative z-10 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black font-headline text-white tracking-tight">
          Your Tribes
        </h1>
        <form action={createDraftChallenge}>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full text-white text-xs font-bold font-headline"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.25)" }}
          >
            + New Challenge
          </button>
        </form>
      </div>
      <p className="text-sm text-[#9CF0FF]/50 mb-8">
        Where communities engage freely, collaborations happen, and participants thrive together.
        {hasTribes && (
          <span className="ml-2 text-white font-bold font-headline">
            {tribeCount} tribe{tribeCount !== 1 ? "s" : ""} · {totalMembers} member{totalMembers !== 1 ? "s" : ""}
          </span>
        )}
      </p>

      {hasTribes ? (
        <div className="space-y-4">
          {challengeSpaces!.map((cs: any) => {
            const mCount = tribeMemberCounts[cs.id] ?? 0;
            const cTitle = challengeTitleMap[cs.source_challenge_id] ?? "";
            const nextSess = tribeNextSessions[cs.id];
            const latestPost = tribeLatestPosts[cs.id];
            const authorName = latestPost ? authorNames[latestPost.author_id] ?? "User" : null;

            return (
              <div
                key={cs.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Orange energy bar */}
                <div className="h-1" style={{ background: "linear-gradient(90deg, #FF6130 0%, rgba(255,97,48,0.2) 100%)" }} />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-black font-headline text-white tracking-tight">
                        {cs.title}
                      </h2>
                      {cTitle && <p className="text-xs text-[#9CF0FF]/40 mt-0.5">{cTitle}</p>}
                    </div>
                    <Link
                      href={`/communities/challenge/${cs.id}`}
                      className="px-4 py-2 rounded-full text-white text-xs font-bold font-headline shrink-0"
                      style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.4)" }}
                    >
                      Enter Tribe →
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-bold font-headline text-white">
                      {mCount} <span className="text-[#9CF0FF]/40 font-normal text-xs">member{mCount !== 1 ? "s" : ""}</span>
                    </span>
                    {nextSess && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF]" />
                        <span className="text-xs font-bold font-headline text-[#9CF0FF]">
                          {formatRelativeTime(nextSess.start_time)}
                        </span>
                        <span className="text-xs text-[#9CF0FF]/40">· {nextSess.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Latest post */}
                  {latestPost ? (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(156,240,255,0.04)", border: "1px solid rgba(156,240,255,0.08)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold font-headline text-white">{authorName}</span>
                        <span className="text-[10px] text-[#9CF0FF]/30">
                          {formatRelativeTime(latestPost.created_at)} ago
                        </span>
                      </div>
                      <p className="text-xs text-[#9CF0FF]/50 line-clamp-2">{latestPost.body}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9CF0FF]/30">No posts yet — be the first to share something</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-black font-headline text-white mb-2">Create your first tribe</h2>
          <p className="text-sm text-[#9CF0FF]/50 max-w-md mx-auto mb-6">
            Publish a challenge and a tribe is born — a space where participants commit, engage freely, and grow together. Separate from your home community. Open for collaboration.
          </p>
          <form action={createDraftChallenge} className="inline-block">
            <button
              type="submit"
              className="px-6 py-3 rounded-full text-white text-sm font-bold font-headline"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
            >
              + Create Challenge
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <Link href="/dashboard" className="text-xs font-bold font-headline text-[#9CF0FF]/40 hover:text-white">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
    </>
  );
}
