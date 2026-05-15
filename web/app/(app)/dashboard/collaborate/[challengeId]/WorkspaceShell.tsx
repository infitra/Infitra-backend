"use client";

import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceChat } from "./WorkspaceChat";
import { RecentChangesExpander } from "./RecentChangesExpander";
import { useWorkspaceRealtime, type ActivityRow } from "./useWorkspaceRealtime";
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
  profileMap: Record<string, { name: string; avatar?: string | null }>;
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
  const { activity } = useWorkspaceRealtime({
    challengeId,
    initialActivity,
    knownSessionIds,
  });

  return (
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
  );
}
