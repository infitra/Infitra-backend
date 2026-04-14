import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceChat } from "./WorkspaceChat";

export const metadata = { title: "Collaboration Workspace — INFITRA" };

export default async function CollaborateWorkspacePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the challenge
  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("id, title, description, start_date, end_date, price_cents, currency, status, owner_id, contract_id, image_url")
    .eq("id", challengeId)
    .single();

  if (!challenge) redirect("/dashboard");

  // Verify user is owner or cohost
  const isOwner = challenge.owner_id === user.id;
  const { data: cohostCheck } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id")
    .eq("challenge_id", challengeId)
    .eq("cohost_id", user.id)
    .maybeSingle();

  const isCohost = !!cohostCheck;
  if (!isOwner && !isCohost) redirect("/dashboard");

  // Fetch all cohosts
  const { data: cohosts } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id, split_percent")
    .eq("challenge_id", challengeId);

  // Fetch profiles for owner + cohosts
  const allUserIds = [challenge.owner_id, ...(cohosts ?? []).map((c: any) => c.cohost_id)];
  const { data: profiles } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url")
    .in("id", allUserIds);

  const profileMap: Record<string, { name: string; avatar: string | null }> = {};
  for (const p of profiles ?? []) profileMap[p.id] = { name: p.display_name ?? "Creator", avatar: p.avatar_url };

  // Fetch linked sessions
  const { data: sessionLinks } = await supabase
    .from("app_challenge_session")
    .select("session_id, app_session(id, title, start_time, duration_minutes, host_id, status)")
    .eq("challenge_id", challengeId);

  const sessions = (sessionLinks ?? [])
    .map((l: any) => l.app_session)
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Fetch contract status
  let contract: any = null;
  let acceptances: string[] = [];
  let declines: { cohostId: string; comment: string | null }[] = [];

  if (challenge.contract_id) {
    const { data: con } = await supabase
      .from("app_collaboration_contract")
      .select("id, locked_at, snapshot_json")
      .eq("id", challenge.contract_id)
      .single();
    contract = con;

    if (con) {
      const { data: acc } = await supabase
        .from("app_collaboration_acceptance")
        .select("cohost_id")
        .eq("contract_id", con.id);
      acceptances = (acc ?? []).map((a: any) => a.cohost_id);

      const { data: dec } = await supabase
        .from("app_collaboration_decline")
        .select("cohost_id, comment")
        .eq("contract_id", con.id);
      declines = (dec ?? []).map((d: any) => ({ cohostId: d.cohost_id, comment: d.comment }));
    }
  }

  // Find DM conversation from invite
  const { data: invite } = await supabase
    .from("app_collaboration_invite")
    .select("dm_conversation_id")
    .eq("challenge_id", challengeId)
    .maybeSingle();

  const dmConversationId = invite?.dm_conversation_id ?? null;

  // Calculate owner split (100% - sum of cohost splits)
  const cohostSplitTotal = (cohosts ?? []).reduce((sum: number, c: any) => sum + (c.split_percent ?? 0), 0);
  const ownerSplit = 100 - cohostSplitTotal;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/create" className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] mb-2 block">
            ← Back to Create
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{ backgroundColor: "#9CF0FF" }} />
            <h1 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">
              Collaboration Workspace
            </h1>
            {challenge.status === "draft" && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-headline text-[#94a3b8]" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Split layout: Editor + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Draft Editor (2/3) */}
        <div className="lg:col-span-2">
          <WorkspaceEditor
            challenge={{
              id: challenge.id,
              title: challenge.title,
              description: challenge.description,
              startDate: challenge.start_date,
              endDate: challenge.end_date,
              priceCents: challenge.price_cents,
              status: challenge.status,
              imageUrl: challenge.image_url,
              contractId: challenge.contract_id,
            }}
            isOwner={isOwner}
            currentUserId={user.id}
            ownerProfile={profileMap[challenge.owner_id] ?? { name: "Owner", avatar: null }}
            ownerSplit={ownerSplit}
            cohosts={(cohosts ?? []).map((c: any) => ({
              id: c.cohost_id,
              name: profileMap[c.cohost_id]?.name ?? "Creator",
              avatar: profileMap[c.cohost_id]?.avatar ?? null,
              splitPercent: c.split_percent,
            }))}
            sessions={sessions.map((s: any) => ({
              id: s.id,
              title: s.title,
              startTime: s.start_time,
              durationMinutes: s.duration_minutes,
              hostId: s.host_id,
              hostName: profileMap[s.host_id]?.name ?? "Host",
            }))}
            contract={contract ? {
              id: contract.id,
              lockedAt: contract.locked_at,
              acceptances,
              declines,
            } : null}
          />
        </div>

        {/* Right: Chat (1/3) */}
        <div className="lg:col-span-1">
          {dmConversationId ? (
            <WorkspaceChat
              conversationId={dmConversationId}
              currentUserId={user.id}
              profiles={profileMap}
            />
          ) : (
            <div className="rounded-2xl infitra-card p-6 text-center">
              <p className="text-sm text-[#94a3b8]">Chat will be available once the collaboration is set up.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
