"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceChat } from "./WorkspaceChat";
import { RecentChangesExpander } from "./RecentChangesExpander";
import { useWorkspaceRealtime, type ActivityRow } from "./useWorkspaceRealtime";
import { WorkspaceStoreProvider, useWorkspaceStore } from "@/lib/workspace/StoreProvider";
import {
  initWorkspaceState,
  type WorkspaceServerSeed,
} from "@/lib/workspace/initFromServerProps";

/**
 * Client wrapper around the workspace grid.
 *
 * Structure (Bundle 3.5 Phase 2): the store PROVIDER is the outer shell,
 * and an inner <WorkspaceGrid> — mounted inside the provider — owns the
 * single useWorkspaceRealtime subscription so the realtime handlers can
 * mutate the store directly. (The hook must sit below the provider to
 * read store actions; in Phase 1 it sat above it, so it could only
 * router.refresh().)
 *
 * page.tsx (server component) fetches the data and mounts this shell with
 * props pre-resolved. Those props seed the store once on mount and, while
 * any slice still propagates via router.refresh(), re-seed it (the Phase 2
 * migration safety net) so a store-reading consumer never goes stale.
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

/** Assemble the server-derived store slices from the resolved props. */
function buildSeed(p: Props): WorkspaceServerSeed {
  return {
    challenge: p.challenge,
    isOwner: p.isOwner,
    currentUserId: p.currentUserId,
    ownerProfile: p.ownerProfile,
    ownerSplit: p.ownerSplit,
    cohosts: p.cohosts,
    sessions: p.sessions,
    pendingInvites: p.pendingInvites ?? [],
    contract: p.contract,
    activity: p.initialActivity,
    profileMap: p.profileMap,
  };
}

export function WorkspaceShell(props: Props) {
  return (
    <WorkspaceStoreProvider initialState={initWorkspaceState(buildSeed(props))}>
      <WorkspaceGrid {...props} />
    </WorkspaceStoreProvider>
  );
}

function WorkspaceGrid(props: Props) {
  const {
    challengeId,
    initialActivity,
    knownSessionIds,
    dmConversationId,
    currentUserId,
    profileMap,
    ...editorProps
  } = props;

  const contractId = editorProps.contract?.id ?? null;

  // Re-seed safety net (Phase 2 migration window). Any slice still flowing
  // through router.refresh() arrives as fresh props; mirror it into the
  // store so store-reading consumers stay consistent. Keyed on a content
  // signature so it only fires when the server data actually changed — and
  // never on the very first render (the provider already seeded that).
  const reseed = useWorkspaceStore((s) => s.seed);
  const seed = buildSeed(props);
  const sig = JSON.stringify(seed);
  const seedRef = useRef(seed);
  seedRef.current = seed;
  const lastSig = useRef(sig);
  useEffect(() => {
    if (lastSig.current !== sig) {
      lastSig.current = sig;
      reseed(seedRef.current);
    }
  }, [sig, reseed]);

  const { activity } = useWorkspaceRealtime({
    challengeId,
    initialActivity,
    knownSessionIds,
    contractId,
  });

  // Phase 4: channel-health pill — shown only while the realtime channel is
  // degraded; clears (and reconciles) automatically on reconnect.
  const channelStatus = useWorkspaceStore((s) => s.ui.channelStatus);
  const degraded = channelStatus === "reconnecting" || channelStatus === "error";

  return (
    <>
      {degraded && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold font-headline flex items-center gap-2"
          style={{
            backgroundColor: "rgba(15,34,41,0.92)",
            color: "#FFFFFF",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "#FFB020" }}
          />
          Reconnecting…
        </div>
      )}
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
    </>
  );
}
