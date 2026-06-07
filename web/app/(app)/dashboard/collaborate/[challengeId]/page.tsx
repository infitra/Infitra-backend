import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkspaceShell } from "./WorkspaceShell";
import { DesktopOnly } from "@/app/components/DesktopOnly";
import type {
  WorkspaceChallenge,
  WorkspaceProfile,
  WorkspaceCohost,
  WorkspaceSession,
  WorkspacePendingInvite,
  WorkspaceContract,
  WorkspaceActivityRow,
} from "@/lib/workspace/store";

export const metadata = { title: "Collaboration Workspace — INFITRA" };

// Reads cookies (auth.getUser) so it's already dynamic; explicit for safety.
export const dynamic = "force-dynamic";

/**
 * Bundle 3.5 Phase 2c: the workspace's entire data load is now ONE round-trip
 * via the load_workspace RPC (was ~12 sequential queries — the slow-open
 * waterfall the query logs flagged). The RPC returns the fully enriched
 * snapshot in the exact shape WorkspaceShell's props need.
 */
interface WorkspaceSnapshot {
  authorized: boolean;
  is_owner: boolean;
  status: string;
  space_id: string | null;
  owner_split: number;
  dm_conversation_id: string | null;
  challenge: WorkspaceChallenge;
  owner_profile: WorkspaceProfile;
  cohosts: WorkspaceCohost[];
  sessions: WorkspaceSession[];
  pending_invites: WorkspacePendingInvite[];
  contract: WorkspaceContract | null;
  activity: WorkspaceActivityRow[];
  profile_map: Record<string, { name: string; avatar: string | null }>;
}

export default async function CollaborateWorkspacePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Single consolidated load (replaces the ~12-query waterfall).
  const { data, error } = await supabase.rpc("load_workspace", {
    p_challenge_id: challengeId,
  });
  const ws = data as WorkspaceSnapshot | null;

  // Not authorized / not found / not owner-or-cohost → bounce out.
  if (error || !ws || !ws.authorized) redirect("/dashboard");

  // The workspace is the drafting room only. Once published it has no edit
  // affordance — land in the challenge space if one exists, else dashboard.
  if (ws.status === "published") {
    if (ws.space_id) redirect(`/experiences/${challengeId}/space`);
    redirect("/dashboard");
  }

  return (
    <div className="py-6">
      {/* Header — muted "Collaboration Workspace" label + draft chip. */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/create"
            className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] mb-2 block"
          >
            ← Back to Create
          </Link>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-sm font-black font-headline uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Collaboration Workspace
            </h1>
            {ws.status === "draft" && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold font-headline uppercase tracking-wider"
                style={{ border: "1px solid rgba(0,0,0,0.08)", color: "#94a3b8" }}
              >
                Draft
              </span>
            )}
          </div>
        </div>
      </div>

      <DesktopOnly
        title="The workspace is best on desktop"
        message="The collaboration workspace is a detailed two-creator editor — themes, sessions, splits, the live contract. Open INFITRA on your laptop or desktop to design your program."
        backHref="/dashboard"
        backLabel="Back to dashboard"
      >
        <WorkspaceShell
          challengeId={ws.challenge.id}
          initialActivity={ws.activity}
          knownSessionIds={ws.sessions.map((s) => s.id)}
          dmConversationId={ws.dm_conversation_id}
          currentUserId={user.id}
          profileMap={ws.profile_map}
          challenge={ws.challenge}
          isOwner={ws.is_owner}
          ownerProfile={ws.owner_profile}
          ownerSplit={ws.owner_split}
          cohosts={ws.cohosts}
          sessions={ws.sessions}
          pendingInvites={ws.pending_invites}
          contract={ws.contract}
        />
      </DesktopOnly>
    </div>
  );
}
