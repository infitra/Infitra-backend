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

  // The workspace is the *drafting room*. Once a challenge is published
  // it ceases to exist for that challenge — there is no valid edit
  // affordance against a live program. Bounce out.
  // - If the challenge has a space → land in the challenge space (where
  //   buyers and the live program live)
  // - Otherwise → back to the dashboard
  if (challenge.status === "published") {
    const { data: space } = await supabase
      .from("app_challenge_space")
      .select("id")
      .eq("source_challenge_id", challengeId)
      .maybeSingle();
    if (space?.id) redirect(`/communities/challenge/${space.id}`);
    redirect("/dashboard");
  }

  // Fetch all cohosts directly
  const { data: cohostRows } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id, split_percent")
    .eq("challenge_id", challengeId);
  const cohosts = cohostRows ?? [];

  // Fetch profiles for owner + cohosts
  const allUserIds = [challenge.owner_id, ...cohosts.map((c: any) => c.cohost_id)];
  const { data: profiles } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url, tagline, bio, username")
    .in("id", allUserIds);

  const profileMap: Record<string, { name: string; avatar: string | null; tagline?: string | null; bio?: string | null; username?: string | null }> = {};
  for (const p of profiles ?? []) profileMap[p.id] = {
    name: p.display_name ?? "Creator",
    avatar: p.avatar_url,
    tagline: p.tagline,
    bio: p.bio,
    username: p.username,
  };

  // Fetch linked sessions (include image_url)
  const { data: sessionLinks } = await supabase
    .from("app_challenge_session")
    .select("session_id, app_session(id, title, start_time, duration_minutes, host_id, status, image_url)")
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

  // Find DM conversation from any invite linked to this challenge
  const { data: invites } = await supabase
    .from("app_collaboration_invite")
    .select("dm_conversation_id, to_id, message, initial_split_percent, status, created_at, id")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true });

  const dmConversationId = (invites ?? []).find((i: any) => i.dm_conversation_id)?.dm_conversation_id ?? null;

  // Pending invites (waiting for response)
  const pendingInvites = (invites ?? []).filter((i: any) => i.status === "pending");
  const pendingInviteeIds = [...new Set(pendingInvites.map((i: any) => i.to_id))];
  const pendingInviteeProfiles: Record<string, { name: string; avatar: string | null; tagline?: string | null; username?: string | null }> = {};
  if (pendingInviteeIds.length > 0) {
    const { data: profs } = await supabase.from("app_profile").select("id, display_name, avatar_url, tagline, username").in("id", pendingInviteeIds);
    for (const p of profs ?? []) pendingInviteeProfiles[p.id] = { name: p.display_name ?? "Creator", avatar: p.avatar_url, tagline: p.tagline, username: p.username };
  }

  // Session cohosts
  const sessionIds = sessions.map((s: any) => s.id);
  let sessionCohostMap: Record<string, { cohostId: string; splitPercent: number }[]> = {};
  if (sessionIds.length > 0) {
    const { data: sessCohosts } = await supabase
      .from("app_session_cohost")
      .select("session_id, cohost_id, split_percent")
      .in("session_id", sessionIds);
    for (const sc of sessCohosts ?? []) {
      if (!sessionCohostMap[(sc as any).session_id]) sessionCohostMap[(sc as any).session_id] = [];
      sessionCohostMap[(sc as any).session_id].push({
        cohostId: (sc as any).cohost_id,
        splitPercent: (sc as any).split_percent ?? 0,
      });
      // Add cohost profiles if not already fetched
      if (!profileMap[(sc as any).cohost_id]) {
        allUserIds.push((sc as any).cohost_id);
      }
    }
    // Fetch missing profiles
    const missingIds = [...new Set((sessCohosts ?? []).map((sc: any) => sc.cohost_id).filter((id: string) => !profileMap[id]))];
    if (missingIds.length > 0) {
      const { data: moreProfs } = await supabase.from("app_profile").select("id, display_name, avatar_url, tagline, bio, username").in("id", missingIds);
      for (const p of moreProfs ?? []) profileMap[p.id] = { name: p.display_name ?? "Creator", avatar: p.avatar_url, tagline: p.tagline, bio: p.bio, username: p.username };
    }
  }

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
            ownerProfile={{ id: challenge.owner_id, ...(profileMap[challenge.owner_id] ?? { name: "Owner", avatar: null }) }}
            ownerSplit={ownerSplit}
            cohosts={(cohosts ?? []).map((c: any) => ({
              id: c.cohost_id,
              name: profileMap[c.cohost_id]?.name ?? "Creator",
              avatar: profileMap[c.cohost_id]?.avatar ?? null,
              tagline: profileMap[c.cohost_id]?.tagline ?? null,
              username: profileMap[c.cohost_id]?.username ?? null,
              splitPercent: c.split_percent,
            }))}
            sessions={sessions.map((s: any) => ({
              id: s.id,
              title: s.title,
              startTime: s.start_time,
              durationMinutes: s.duration_minutes,
              hostId: s.host_id,
              hostName: profileMap[s.host_id]?.name ?? "Host",
              hostAvatar: profileMap[s.host_id]?.avatar ?? null,
              imageUrl: s.image_url ?? null,
              cohosts: (sessionCohostMap[s.id] ?? []).map((sc) => ({
                id: sc.cohostId,
                name: profileMap[sc.cohostId]?.name ?? "Creator",
                avatar: profileMap[sc.cohostId]?.avatar ?? null,
                splitPercent: sc.splitPercent,
              })),
            }))}
            pendingInvites={pendingInvites.map((i: any) => ({
              id: i.id,
              toId: i.to_id,
              toName: pendingInviteeProfiles[i.to_id]?.name ?? "Creator",
              toAvatar: pendingInviteeProfiles[i.to_id]?.avatar ?? null,
              toTagline: pendingInviteeProfiles[i.to_id]?.tagline ?? null,
              toUsername: pendingInviteeProfiles[i.to_id]?.username ?? null,
              splitPercent: i.initial_split_percent,
              message: i.message,
            }))}
            contract={contract ? {
              id: contract.id,
              lockedAt: contract.locked_at,
              acceptances,
              declines,
            } : null}
          />
        </div>

        {/* Right: Chat (1/3) — sticky so it stays visible while page scrolls */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
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
    </div>
  );
}
