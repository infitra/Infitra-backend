import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";
import { CollabInviteFlow } from "./CollabInviteFlow";

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
    .select("id, title, created_at, owner_id")
    .eq("owner_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(5);

  // Collab drafts where user is cohost
  const { data: collabCohostLinks } = await supabase
    .from("app_challenge_cohost")
    .select("challenge_id, app_challenge(id, title, owner_id, status)")
    .eq("cohost_id", user.id);

  const collabDrafts = (collabCohostLinks ?? [])
    .filter((l: any) => l.app_challenge?.status === "draft")
    .map((l: any) => l.app_challenge);

  // Cohost owner names
  const collabOwnerIds = [...new Set(collabDrafts.map((c: any) => c.owner_id))];
  const collabOwnerNames: Record<string, string> = {};
  if (collabOwnerIds.length > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name").in("id", collabOwnerIds);
    for (const p of profiles ?? []) collabOwnerNames[p.id] = p.display_name ?? "Creator";
  }

  const hasDrafts = (draftChallenges ?? []).length > 0;
  const hasCollabDrafts = collabDrafts.length > 0;

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-7 rounded-full" style={{ backgroundColor: "#FF6130" }} />
        <h1 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight">
          Create
        </h1>
      </div>
      <p className="text-sm text-[#64748b] mb-8 ml-[19px]">
        Launch challenges in your tribe — solo or with other creators.
      </p>

      {/* ── TWO PATHS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Solo Challenge */}
        <div className="rounded-2xl infitra-card overflow-hidden">
          <div className="h-1.5" style={{ background: "linear-gradient(90deg, #FF6130, rgba(255,97,48,0.3))" }} />
          <div className="p-6">
            <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight mb-2">
              Launch Solo
            </h2>
            <p className="text-sm text-[#64748b] mb-5">
              Create a challenge in your tribe. You own it, you run it, you keep 100% of the creator share.
            </p>
            <form action={createDraftChallenge}>
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-white text-sm font-black font-headline w-full"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
              >
                + Start Challenge
              </button>
            </form>
          </div>
        </div>

        {/* Collaboration */}
        <div className="rounded-2xl infitra-card overflow-hidden">
          <div className="h-1.5" style={{ background: "linear-gradient(90deg, #9CF0FF, rgba(156,240,255,0.3))" }} />
          <div className="p-6">
            <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight mb-2">
              Start Collaboration
            </h2>
            <p className="text-sm text-[#64748b] mb-5">
              Co-create with another creator. Share sessions, split revenue, grow both tribes.
            </p>
            <CollabInviteFlow />
          </div>
        </div>
      </div>

      {/* ── DRAFTS IN PROGRESS ────────────────────────────── */}
      {hasDrafts && (
        <div className="mb-6">
          <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-3">
            Your Drafts
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
                  <p className="text-[10px] text-[#94a3b8]">Draft · Solo</p>
                </div>
                <span className="text-[10px] font-bold font-headline text-[#FF6130] shrink-0">
                  Continue →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── COLLAB DRAFTS ────────────────────────────────── */}
      {hasCollabDrafts && (
        <div className="mb-6">
          <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-3">
            Collaboration Drafts
          </h3>
          <div className="space-y-2">
            {collabDrafts.map((ch: any) => (
              <Link
                key={ch.id}
                href={`/dashboard/collaborate/${ch.id}`}
                className="group flex items-center justify-between p-4 rounded-2xl infitra-card-link"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold font-headline truncate text-[#0F2229] group-hover:text-[#FF6130]">
                    {ch.title || "Untitled Collaboration"}
                  </p>
                  <p className="text-[10px] text-[#0891b2]">
                    Collab with {collabOwnerNames[ch.owner_id] ?? "Creator"}
                  </p>
                </div>
                <span className="text-[10px] font-bold font-headline text-[#FF6130] shrink-0">
                  Open Workspace →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── QUICK SESSION ─────────────────────────────────── */}
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-headline text-[#0F2229] mb-1">
              Quick Session
            </h3>
            <p className="text-xs text-[#64748b]">
              One-off live session. No challenge needed.
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
    </div>
  );
}
