import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";

export const metadata = {
  title: "Create — INFITRA",
};

export default async function CreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Draft challenges (in progress)
  const { data: draftChallenges } = await supabase
    .from("app_challenge")
    .select("id, title, created_at")
    .eq("owner_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(5);

  // Published standalone sessions (not linked to any challenge)
  const { data: standaloneSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, status, price_cents")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Find which sessions are challenge-linked
  const allSessionIds = (standaloneSessions ?? []).map((s: any) => s.id);
  const linkedSessionIds = new Set<string>();
  if (allSessionIds.length > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("session_id")
      .in("session_id", allSessionIds);
    for (const l of links ?? []) linkedSessionIds.add((l as any).session_id);
  }

  const standaloneOnly = (standaloneSessions ?? []).filter(
    (s: any) => !linkedSessionIds.has(s.id)
  );

  // Count tribes (published challenges with spaces)
  const { count: tribeCount } = await supabase
    .from("app_challenge_space")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const hasDrafts = (draftChallenges ?? []).length > 0;

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight mb-2">
        Create
      </h1>
      <p className="text-sm text-[#64748b] mb-8">
        Build sessions and challenges. Challenges become tribes when published.
      </p>

      {/* ── THE GOLDEN PATH ───────────────────────────────── */}
      <div className="rounded-2xl infitra-card overflow-hidden mb-6">
        <div className="h-1.5" style={{ background: "linear-gradient(90deg, #FF6130, rgba(255,97,48,0.3))" }} />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold font-headline uppercase tracking-wider text-[#FF6130]">
              The Golden Path
            </span>
            {(tribeCount ?? 0) > 0 && (
              <span className="text-[10px] text-[#94a3b8]">· {tribeCount} tribe{(tribeCount ?? 0) !== 1 ? "s" : ""} created</span>
            )}
          </div>
          <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight mb-2">
            Start a Challenge
          </h2>
          <p className="text-sm text-[#64748b] mb-5 max-w-lg">
            Bundle 3+ sessions into a challenge. When you publish, a tribe is born — a community where participants engage freely, collaborate, and grow together. This is where the magic happens.
          </p>
          <div className="flex items-center gap-3">
            <form action={createDraftChallenge}>
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-white text-sm font-bold font-headline"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
              >
                + Start Challenge
              </button>
            </form>
            <span className="text-[10px] text-[#94a3b8]">
              Sessions → Challenge → Publish → Tribe
            </span>
          </div>
        </div>
      </div>

      {/* ── DRAFTS IN PROGRESS ────────────────────────────── */}
      {hasDrafts && (
        <div className="mb-6">
          <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-3">
            Drafts in Progress
          </h3>
          <div className="space-y-2">
            {draftChallenges!.map((ch: any) => (
              <Link
                key={ch.id}
                href={`/dashboard/challenges/${ch.id}`}
                className="group flex items-center justify-between p-4 rounded-2xl infitra-card-link"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold font-headline truncate text-[#0F2229] group-hover:text-[#FF6130]">
                    {ch.title || "Untitled Challenge"}
                  </p>
                  <p className="text-[10px] text-[#94a3b8]">Draft · Challenge</p>
                </div>
                <span className="text-[10px] font-bold font-headline text-[#FF6130] shrink-0">
                  Continue →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── QUICK SESSION ─────────────────────────────────── */}
      <div className="rounded-2xl infitra-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-headline text-[#0F2229] mb-1">
              Quick Session
            </h3>
            <p className="text-xs text-[#64748b]">
              One-off live session. No challenge needed. Sold individually.
            </p>
          </div>
          <Link
            href="/dashboard/sessions/new"
            className="px-4 py-2.5 rounded-full text-xs font-bold font-headline text-[#0F2229] shrink-0"
            style={{ border: "1px solid rgba(0,0,0,0.10)" }}
          >
            + Create Session
          </Link>
        </div>
      </div>

      {/* ── STANDALONE SESSIONS ───────────────────────────── */}
      {standaloneOnly.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-[#94a3b8]">
              Standalone Sessions
            </h3>
            <Link href="/dashboard/sessions" className="text-[10px] font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]">
              All Sessions →
            </Link>
          </div>
          <div className="space-y-2">
            {standaloneOnly.slice(0, 5).map((sess: any) => (
              <Link
                key={sess.id}
                href={`/dashboard/sessions/${sess.id}`}
                className="group flex items-center justify-between p-3 rounded-xl infitra-card-link"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold font-headline truncate text-[#0F2229] group-hover:text-[#FF6130]">
                    {sess.title}
                  </p>
                  <p className="text-[10px] text-[#94a3b8]">
                    {sess.status === "draft" ? "Draft" : sess.status === "published" ? "Published" : sess.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
