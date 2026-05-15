"use client";

import { useState } from "react";
import { ShareDonut } from "@/app/components/ShareDonut";
import { CollabInviteFlow } from "@/app/(app)/dashboard/create/CollabInviteFlow";
import { SectionAttribution } from "./SectionAttribution";
import type { ActivityRow } from "./useWorkspaceRealtime";

/**
 * The Team — combined Collaborators + Revenue Share + Who Handles What
 * into one card. One row per creator (owner + each cohost) showing:
 *   avatar · name + role · topics owned (editable) · session count chip
 *   · revenue split (display for owner, slider for cohosts).
 *
 * Replaces three separate fragmented cards from Bundle 3 v1. Per-row
 * topics + per-row split adjustment land in the same place — the user
 * decides everything about a creator without scrolling.
 *
 * Save model: topics auto-save on blur via onTopicsCommit; cohost split
 * auto-saves on slider release via onCohostSplitCommit. Both are
 * controlled by the parent (WorkspaceEditor owns the state + save flow).
 */

export interface CreatorRow {
  id: string;
  name: string;
  avatar: string | null;
  tagline: string | null;
  bio: string | null;
  username: string | null;
  role: "owner" | "cohost";
  /** Sessions hosted by this creator (auto-derived). */
  sessionCount: number;
  /** Cohorts have a split percent; owner's is computed from the rest. */
  splitPercent: number;
}

export interface PendingInviteRow {
  id: string;
  toId: string;
  toName: string;
  toAvatar: string | null;
  toTagline: string | null;
  toUsername: string | null;
  splitPercent: number;
  message: string;
}

interface Props {
  challengeId: string;
  creators: CreatorRow[];
  pendingInvites: PendingInviteRow[];
  topicsByCreator: Record<string, string[]>;
  /** Owner's split = 100 − sum(cohost splits). Caller computes & passes in. */
  ownerSplit: number;

  canEdit: boolean;
  /** Owner-only: can adjust splits and invite. */
  canManageCollaboration: boolean;

  onTopicsCommit: (creatorId: string, topics: string[]) => void;
  onCohostSplitCommit: (cohostId: string, splitPercent: number) => void;

  activity: ActivityRow[];
  profileMap: Record<string, { name: string; avatar: string | null }>;
}

const TEAM_ATTRIBUTION_FIELDS = [
  "cohost_added",
  "cohost_removed",
  "cohost_split",
  "topic_ownership",
  "session_cohost_added",
  "session_cohost_removed",
];

const MAX_TOPICS_PER_CREATOR = 6;
const MAX_TOPIC_LENGTH = 30;

function topicsToString(topics: string[]): string {
  return topics.join(", ");
}

function stringToTopics(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, MAX_TOPICS_PER_CREATOR)
    .map((t) => t.slice(0, MAX_TOPIC_LENGTH));
}

export function TeamSection({
  challengeId,
  creators,
  pendingInvites,
  topicsByCreator,
  ownerSplit,
  canEdit,
  canManageCollaboration,
  onTopicsCommit,
  onCohostSplitCommit,
  activity,
  profileMap,
}: Props) {
  const totalCount = creators.length + pendingInvites.length;

  // ShareDonut shape. Pending invitees show as a hatched slice (we
  // approximate by including them at their proposed split with a
  // tertiary color so the split picture matches what's "in flight").
  const shares = [
    {
      label: creators.find((c) => c.role === "owner")?.name ?? "Owner",
      percent: ownerSplit,
      color: "#FF6130",
    },
    ...creators
      .filter((c) => c.role === "cohost")
      .map((c) => ({
        label: c.name,
        percent: c.splitPercent,
        color: "#9CF0FF",
      })),
  ];

  return (
    <div className="rounded-2xl infitra-card p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">
          The Team · {totalCount}
        </h3>
        {canManageCollaboration && (
          <div className="shrink-0">
            <CollabInviteFlow
              existingChallengeId={challengeId}
              existingCollaboratorIds={[
                ...creators.map((c) => c.id),
                ...pendingInvites.map((p) => p.toId),
              ]}
            />
          </div>
        )}
      </div>

      {/* Donut at the top — quick visual of the split */}
      <div className="flex items-center gap-6 mb-6 pb-6" style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
        <ShareDonut size={120} shares={shares} />
        <div className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
          Each row below: who&apos;s on the team, what they own, and how
          revenue splits. Topics are a soft routing signal — comma-separated,
          your call.
        </div>
      </div>

      {/* Confirmed creators */}
      <div className="space-y-3">
        {creators.map((creator) => (
          <CreatorRowCard
            key={creator.id}
            creator={creator}
            topics={topicsByCreator[creator.id] ?? []}
            displayedSplit={creator.role === "owner" ? ownerSplit : creator.splitPercent}
            canEdit={canEdit}
            canManageCollaboration={canManageCollaboration}
            onTopicsCommit={(topics) => onTopicsCommit(creator.id, topics)}
            onSplitCommit={
              creator.role === "cohost"
                ? (split) => onCohostSplitCommit(creator.id, split)
                : undefined
            }
          />
        ))}

        {/* Pending invitees — display only */}
        {pendingInvites.map((invite) => (
          <PendingRowCard key={invite.id} invite={invite} />
        ))}
      </div>

      <SectionAttribution
        fields={TEAM_ATTRIBUTION_FIELDS}
        activity={activity}
        profiles={profileMap}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CreatorRowCard — one row per confirmed owner/cohost. Topics input
// auto-saves on blur; split slider auto-saves on commit (release).
// ─────────────────────────────────────────────────────────────────

function CreatorRowCard({
  creator,
  topics,
  displayedSplit,
  canEdit,
  canManageCollaboration,
  onTopicsCommit,
  onSplitCommit,
}: {
  creator: CreatorRow;
  topics: string[];
  displayedSplit: number;
  canEdit: boolean;
  canManageCollaboration: boolean;
  onTopicsCommit: (topics: string[]) => void;
  onSplitCommit?: (splitPercent: number) => void;
}) {
  const roleColor = creator.role === "owner" ? "#FF6130" : "#0891b2";
  const [topicsLocal, setTopicsLocal] = useState(topicsToString(topics));
  const [splitLocal, setSplitLocal] = useState(displayedSplit);

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: "rgba(0,0,0,0.02)",
        border: "1px solid rgba(15,34,41,0.06)",
      }}
    >
      <div className="flex items-start gap-4 flex-wrap">
        {/* Identity column */}
        <div className="flex items-center gap-3" style={{ minWidth: 180 }}>
          {creator.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${roleColor}20` }}
            >
              <span className="text-sm font-black font-headline" style={{ color: roleColor }}>
                {creator.name?.[0] ?? "?"}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold font-headline truncate" style={{ color: "#0F2229" }}>
              {creator.name}
            </p>
            <p
              className="text-[10px] font-bold font-headline uppercase tracking-wider"
              style={{ color: roleColor }}
            >
              {creator.role} · {displayedSplit}%
            </p>
          </div>
        </div>

        {/* Topics input + sessions chip stacked on small, side-by-side on wider */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 min-w-0 items-center">
          <div>
            <p
              className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1"
              style={{ color: "#94a3b8" }}
            >
              Topics owned
            </p>
            {canEdit ? (
              <input
                type="text"
                value={topicsLocal}
                onChange={(e) => setTopicsLocal(e.target.value)}
                onBlur={() => {
                  const next = stringToTopics(topicsLocal);
                  if (topicsToString(next) !== topicsToString(topics)) {
                    onTopicsCommit(next);
                  }
                  setTopicsLocal(topicsToString(next));
                }}
                placeholder="training, strength, recovery"
                className="w-full rounded-lg p-2 text-xs font-bold font-headline focus:outline-none"
                style={{
                  border: "1px solid rgba(15,34,41,0.10)",
                  color: "#0F2229",
                  backgroundColor: "white",
                }}
              />
            ) : topics.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {topics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-md font-bold font-headline"
                    style={{
                      backgroundColor: "rgba(8,145,178,0.08)",
                      color: "#0891b2",
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] italic" style={{ color: "#94a3b8" }}>
                No topics yet
              </p>
            )}
          </div>

          <div
            className="shrink-0 px-3 py-2 rounded-lg text-center"
            style={{
              backgroundColor: "rgba(15,34,41,0.04)",
              minWidth: 90,
            }}
          >
            <p
              className="text-base font-black font-headline"
              style={{ color: "#0F2229" }}
            >
              {creator.sessionCount}
            </p>
            <p
              className="text-[9px] font-bold font-headline uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              {creator.sessionCount === 1 ? "session" : "sessions"}
            </p>
          </div>
        </div>
      </div>

      {/* Cohost split slider (owner-managed) */}
      {creator.role === "cohost" && onSplitCommit && canManageCollaboration && (
        <div
          className="mt-4 pt-3 flex items-center gap-3"
          style={{ borderTop: "1px solid rgba(15,34,41,0.04)" }}
        >
          <p
            className="text-[10px] font-bold font-headline uppercase tracking-wider shrink-0"
            style={{ color: "#94a3b8", minWidth: 90 }}
          >
            Revenue split
          </p>
          <input
            type="range"
            min={1}
            max={99}
            value={splitLocal}
            onChange={(e) => setSplitLocal(parseInt(e.target.value))}
            onMouseUp={() => {
              if (splitLocal !== displayedSplit) onSplitCommit(splitLocal);
            }}
            onTouchEnd={() => {
              if (splitLocal !== displayedSplit) onSplitCommit(splitLocal);
            }}
            className="flex-1 accent-cyan-500"
          />
          <span
            className="text-sm font-black font-headline shrink-0"
            style={{ color: "#0F2229", minWidth: 40, textAlign: "right" }}
          >
            {splitLocal}%
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PendingRowCard — display-only row for invitees who haven't accepted.
// ─────────────────────────────────────────────────────────────────

function PendingRowCard({ invite }: { invite: PendingInviteRow }) {
  return (
    <div
      className="p-4 rounded-xl flex items-center gap-3"
      style={{
        backgroundColor: "rgba(255,255,255,0.4)",
        border: "1px dashed rgba(8,145,178,0.30)",
      }}
    >
      {invite.toAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={invite.toAvatar}
          alt=""
          className="w-10 h-10 rounded-full object-cover shrink-0 opacity-60"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(8,145,178,0.10)" }}
        >
          <span className="text-sm font-black" style={{ color: "#0891b2" }}>
            {invite.toName[0]}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold font-headline truncate" style={{ color: "#0F2229" }}>
          {invite.toName}
        </p>
        <p
          className="text-[10px] font-bold font-headline uppercase tracking-wider"
          style={{ color: "#0891b2" }}
        >
          Invited · {invite.splitPercent}% proposed
        </p>
      </div>
      <span
        className="text-[10px] font-bold font-headline uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
        style={{
          backgroundColor: "rgba(8,145,178,0.10)",
          color: "#0891b2",
        }}
      >
        Awaiting
      </span>
    </div>
  );
}
