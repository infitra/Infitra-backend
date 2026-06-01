"use client";

import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceChat } from "./WorkspaceChat";
import { RecentChangesExpander } from "./RecentChangesExpander";
import { useWorkspaceRealtime, type ActivityRow } from "./useWorkspaceRealtime";
import { WorkspaceStoreProvider } from "@/lib/workspace/StoreProvider";
import { initWorkspaceState } from "@/lib/workspace/initFromServerProps";
import type { ComponentProps } from "react";

/**
 * Client wrapper around the workspace grid. Owns the single
 * useWorkspaceRealtime subscription so the editor, the activity
 * expander, and the chat all share one channel and one live activity
 * array (no duplicate subscriptions, no N+1 channel sprawl).
 *
 * page.tsx (server component) does the data fetching, then mounts
 * this shell with the props pre-resolved. The shell passes live
 * activity into WorkspaceEditor (for SectionAttribution chips) and
 * into RecentChangesExpander.
 *
 * Right rail uses a flex column so the chat fills remaining vertical
 * space — fixes the chat-cut-off-at-bottom bug from Bundle 3 v1.
 */

type WorkspaceEditorProps = Omit<ComponentProps<typeof WorkspaceEditor>, "activity">;

interface Props extends WorkspaceEditorProps {
  challengeId: string;
  initialActivity: ActivityRow[];
  knownSessionIds: string[];
  dmConversationId: string | null;
  currentUserId: string;
  profileMap: Record<string, { name: string; avatar: string | null }>;
}

export function WorkspaceShell({
  challengeId,
  initialActivity,
  knownSessionIds,
  dmConversationId,
  currentUserId,
  profileMap,
  ...editorProps
}: Props) {
  // Polish v12.W: thread the active contract id down to the realtime
  // hook so it can filter acceptance/decline INSERT events to this
  // contract only (broad subscription, client-side filter).
  const contractId = (editorProps as { contract?: { id?: string } | null }).contract?.id ?? null;

  const { activity } = useWorkspaceRealtime({
    challengeId,
    initialActivity,
    knownSessionIds,
    contractId,
  });

  // Bundle 3.5 Phase 1: seed the workspace store from the resolved props.
  // INERT for now — the store is created and populated but no descendant
  // reads from it yet (consumers migrate to selectors in Phase 2). The
  // provider creates exactly one store per mount (SSR-safe; not a
  // singleton). Built once on mount from the initial props; live updates
  // still flow through props/router.refresh until Phase 2 rewires them.
  const initialState = initWorkspaceState({
    challenge: editorProps.challenge,
    isOwner: editorProps.isOwner,
    currentUserId,
    ownerProfile: editorProps.ownerProfile,
    ownerSplit: editorProps.ownerSplit,
    cohosts: editorProps.cohosts,
    sessions: editorProps.sessions,
    pendingInvites: editorProps.pendingInvites ?? [],
    contract: editorProps.contract,
    activity,
    profileMap,
  });

  return (
    <WorkspaceStoreProvider initialState={initialState}>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Workspace editor (2/3) */}
      <div className="lg:col-span-2">
        <WorkspaceEditor
          {...editorProps}
          currentUserId={currentUserId}
          profileMap={profileMap}
          activity={activity}
        />
      </div>

      {/* Right: Recent changes + Chat in a flex column so chat fills
          remaining vertical space. Sticky to the top of the scrollable
          area so it stays visible while the editor scrolls. */}
      <div className="lg:col-span-1">
        <div
          className="lg:sticky flex flex-col gap-3"
          style={{
            top: "96px",
            height: "calc(100vh - 120px)",
            minHeight: "500px",
          }}
        >
          <RecentChangesExpander
            challengeId={challengeId}
            activity={activity}
            profiles={profileMap}
          />
          <div className="flex-1 min-h-0">
            {dmConversationId ? (
              <WorkspaceChat
                conversationId={dmConversationId}
                currentUserId={currentUserId}
                profiles={profileMap}
              />
            ) : (
              <div className="rounded-2xl infitra-card p-6 text-center">
                <p className="text-sm text-[#94a3b8]">
                  Chat will be available once the collaboration is set up.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </WorkspaceStoreProvider>
  );
}
