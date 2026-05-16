"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Owner-only: remove a cohost from the challenge. */
  onCohostRemove?: (cohostId: string) => void;

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
  onCohostRemove,
  activity,
  profileMap,
}: Props) {
  const totalCount = creators.length + pendingInvites.length;

  const ownerCreator = creators.find((c) => c.role === "owner");
  const cohorts = creators.filter((c) => c.role === "cohost");
  const singleCohort = cohorts.length === 1 ? cohorts[0] : null;

  // Single-cohort case: live slider state. The slider lives directly
  // under the donut block so dragging it updates the donut visually
  // before the save fires (and before the partner's view refreshes).
  // Local-wins sync against partner saves via dirty ref.
  const [liveCohortSplit, setLiveCohortSplit] = useState(singleCohort?.splitPercent ?? 0);
  const liveSplitDirty = useRef(false);
  const lastLiveSplitProp = useRef(singleCohort?.splitPercent ?? 0);
  useEffect(() => {
    const propValue = singleCohort?.splitPercent ?? 0;
    if (propValue !== lastLiveSplitProp.current) {
      lastLiveSplitProp.current = propValue;
      if (!liveSplitDirty.current) setLiveCohortSplit(propValue);
    }
  }, [singleCohort?.splitPercent]);

  // Owner's percentage during a live drag. For multi-cohost cases it
  // stays as the prop value (no live editing in this iteration).
  const liveOwnerSplit = singleCohort ? 100 - liveCohortSplit : ownerSplit;

  // Build the donut segments. Owner first (orange), cohorts after
  // (cyan). Two colours per segment: visualColor for fills (donut arc,
  // legend dot, slider track) using the bright brand cyan; color for
  // readable text (big % number, role label) using the darker cyan.
  type Segment = {
    id: string;
    name: string;
    role: string;
    percent: number;
    color: string;
    visualColor: string;
  };
  const segments: Segment[] = [];
  if (ownerCreator) {
    segments.push({
      id: ownerCreator.id,
      name: ownerCreator.name,
      role: "Owner",
      percent: liveOwnerSplit,
      color: "#FF6130",
      visualColor: "#FF6130",
    });
  }
  for (const c of cohorts) {
    segments.push({
      id: c.id,
      name: c.name,
      role: "Cohost",
      percent: singleCohort && c.id === singleCohort.id ? liveCohortSplit : c.splitPercent,
      color: "#0891b2",
      visualColor: "#9CF0FF",
    });
  }

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

      {/* Description */}
      <p className="text-sm leading-relaxed mb-6" style={{ color: "#475569" }}>
        Each creator&apos;s revenue share, sessions they lead, and the topics
        they own. Topics help participants know who to ask about what.
      </p>

      {/* Hero donut + legend + (single-cohort) slider. The donut is the
          load-bearing visual of the split — bright brand cyan for the
          arc, orange for owner. Legend uses the same visual cyan for
          dots, darker cyan for readable text. For single-cohort
          collaborations the slider lives DIRECTLY under the donut as
          its control surface — dragging it updates the donut live. */}
      <div className="mb-6 pb-6" style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
        <div className="flex items-center gap-8 flex-wrap">
          <TeamDonut segments={segments} totalCount={totalCount} size={240} />
          <div className="flex-1 min-w-[220px] space-y-4">
            {segments.map((seg) => (
              <div key={seg.id} className="flex items-center gap-3">
                <div
                  className="shrink-0 w-4 h-4 rounded-full"
                  style={{ backgroundColor: seg.visualColor }}
                />
                <span
                  className="text-4xl font-black font-headline leading-none"
                  style={{ color: seg.color, minWidth: 88 }}
                >
                  {seg.percent}%
                </span>
                <div className="min-w-0 flex flex-col justify-center">
                  <p
                    className="text-sm font-bold font-headline truncate leading-tight"
                    style={{ color: "#0F2229" }}
                  >
                    {seg.name}
                  </p>
                  <p
                    className="text-[10px] font-bold font-headline uppercase tracking-wider mt-0.5"
                    style={{ color: seg.color }}
                  >
                    {seg.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider — lives under the donut+legend so the control is
            adjacent to the visualization. Single-cohost only for now;
            multi-cohort case will get per-cohort sliders below the
            legend (deferred until the pilot needs >2 creator teams). */}
        {singleCohort && canManageCollaboration && (
          <div className="mt-6 pt-5 flex items-center gap-3" style={{ borderTop: "1px dashed rgba(15,34,41,0.10)" }}>
            <p className="text-[10px] font-bold font-headline uppercase tracking-wider shrink-0" style={{ color: "#94a3b8", minWidth: 90 }}>
              Adjust split
            </p>
            <div className="relative flex-1 flex items-center" style={{ height: 24 }}>
              <div
                className="absolute inset-0 my-auto rounded-full pointer-events-none"
                style={{
                  height: 6,
                  background: `linear-gradient(to right,
                    #FF6130 0%,
                    #FF6130 ${100 - liveCohortSplit}%,
                    #9CF0FF ${100 - liveCohortSplit}%,
                    #9CF0FF 100%)`,
                }}
              />
              <input
                type="range"
                min={1}
                max={99}
                value={100 - liveCohortSplit}
                onChange={(e) => {
                  liveSplitDirty.current = true;
                  setLiveCohortSplit(100 - parseInt(e.target.value));
                }}
                onMouseUp={() => {
                  if (liveCohortSplit !== singleCohort.splitPercent) {
                    onCohostSplitCommit(singleCohort.id, liveCohortSplit);
                  }
                  liveSplitDirty.current = false;
                }}
                onTouchEnd={() => {
                  if (liveCohortSplit !== singleCohort.splitPercent) {
                    onCohostSplitCommit(singleCohort.id, liveCohortSplit);
                  }
                  liveSplitDirty.current = false;
                }}
                className="dual-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
                style={{ outline: "none" }}
                aria-label={`Revenue split between owner and ${singleCohort.name}`}
              />
            </div>
            <div className="shrink-0 flex items-baseline gap-1 font-black font-headline" style={{ minWidth: 90, justifyContent: "flex-end" }}>
              <span className="text-sm" style={{ color: "#FF6130" }}>{100 - liveCohortSplit}%</span>
              <span className="text-xs" style={{ color: "#94a3b8" }}>/</span>
              <span className="text-sm" style={{ color: "#0891b2" }}>{liveCohortSplit}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmed creators — identity + topics + sessions only. The
          slider for the single-cohort case lives in the donut block
          above. For multi-cohort (2+) cases each row gets its own
          inline slider via showSliderInRow=true. */}
      <div className="space-y-3">
        {creators.map((creator) => (
          <CreatorRowCard
            key={creator.id}
            creator={creator}
            topics={topicsByCreator[creator.id] ?? []}
            displayedSplit={creator.role === "owner" ? ownerSplit : creator.splitPercent}
            ownerSplit={ownerSplit}
            canEdit={canEdit}
            canManageCollaboration={canManageCollaboration}
            // Only render the in-row slider when there are 2+ cohorts;
            // single-cohort case has the slider under the donut.
            showSliderInRow={cohorts.length > 1}
            onTopicsCommit={(topics) => onTopicsCommit(creator.id, topics)}
            onSplitCommit={
              creator.role === "cohost"
                ? (split) => onCohostSplitCommit(creator.id, split)
                : undefined
            }
            onRemove={
              creator.role === "cohost" && canManageCollaboration && onCohostRemove
                ? () => onCohostRemove(creator.id)
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
  ownerSplit,
  canEdit,
  canManageCollaboration,
  showSliderInRow,
  onTopicsCommit,
  onSplitCommit,
  onRemove,
}: {
  creator: CreatorRow;
  topics: string[];
  displayedSplit: number;
  /** Owner's current %, used to render the dual-color slider track. */
  ownerSplit: number;
  canEdit: boolean;
  canManageCollaboration: boolean;
  /** When true, render the dual-colour slider inline below this row.
   *  Single-cohort collaborations set this to false because their
   *  slider lives under the donut block. */
  showSliderInRow?: boolean;
  onTopicsCommit: (topics: string[]) => void;
  onSplitCommit?: (splitPercent: number) => void;
  onRemove?: () => void;
}) {
  const roleColor = creator.role === "owner" ? "#FF6130" : "#0891b2";

  // Local-wins sync against partner saves arriving via prop changes.
  // Without this, useState(...) only initialises once and the partner's
  // edit never updates the visible input — the bug from polish v1.
  const topicsString = topicsToString(topics);
  const [topicsLocal, setTopicsLocal] = useState(topicsString);
  const topicsDirty = useRef(false);
  const lastTopicsProp = useRef(topicsString);
  useEffect(() => {
    if (topicsString !== lastTopicsProp.current) {
      lastTopicsProp.current = topicsString;
      if (!topicsDirty.current) setTopicsLocal(topicsString);
    }
  }, [topicsString]);

  const [splitLocal, setSplitLocal] = useState(displayedSplit);
  const splitDirty = useRef(false);
  const lastSplitProp = useRef(displayedSplit);
  useEffect(() => {
    if (displayedSplit !== lastSplitProp.current) {
      lastSplitProp.current = displayedSplit;
      if (!splitDirty.current) setSplitLocal(displayedSplit);
    }
  }, [displayedSplit]);

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: "rgba(0,0,0,0.02)",
        border: "1px solid rgba(15,34,41,0.06)",
      }}
    >
      {/* Strict 4-column grid so owner and cohost rows column-align
          regardless of avatar type, name length, or chip width.
          Columns: identity (200px) · topics (1fr) · sessions (80px) ·
          ×-or-placeholder (32px). */}
      <div className="grid items-center gap-4" style={{ gridTemplateColumns: "200px 1fr 80px 32px" }}>
        {/* Identity column */}
        <div className="flex items-center gap-3 min-w-0">
          {creator.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar}
              alt=""
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${roleColor}20` }}
            >
              <span className="text-base font-black font-headline" style={{ color: roleColor }}>
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
              {creator.role}
            </p>
          </div>
        </div>

        {/* Topics input — middle column */}
        <div className="min-w-0">
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
              onChange={(e) => {
                topicsDirty.current = true;
                setTopicsLocal(e.target.value);
              }}
              onBlur={() => {
                const next = stringToTopics(topicsLocal);
                if (topicsToString(next) !== topicsToString(topics)) {
                  onTopicsCommit(next);
                }
                setTopicsLocal(topicsToString(next));
                topicsDirty.current = false;
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

        {/* Sessions count — quieter chip. Fixed 80px column so owner
            and cohost rows align even when one has "10 sessions" and
            the other has "1 session". The % REVENUE chip that used to
            live here was dropped in polish v5: donut + legend carry
            that data; the role label (orange OWNER / cyan COHOST)
            keeps the per-row colour anchor. */}
        <div
          className="flex flex-col items-center justify-center px-3 py-2 rounded-xl"
          style={{ backgroundColor: "rgba(15,34,41,0.04)" }}
        >
          <p
            className="text-xl font-black font-headline leading-none"
            style={{ color: "#0F2229" }}
          >
            {creator.sessionCount}
          </p>
          <p
            className="text-[9px] font-bold font-headline uppercase tracking-wider mt-1"
            style={{ color: "#94a3b8" }}
          >
            {creator.sessionCount === 1 ? "session" : "sessions"}
          </p>
        </div>

        {/* Remove cohost — fixed 32px column at the row's end. Owner
            row gets an invisible placeholder of the same width so both
            rows align column-by-column. */}
        {onRemove ? (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove ${creator.name} from the collaboration?`)) {
                onRemove();
              }
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-colors"
            title={`Remove ${creator.name}`}
            aria-label={`Remove ${creator.name}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="w-8 h-8" aria-hidden="true" />
        )}
      </div>

      {/* In-row split slider — only shown for multi-cohort cases (2+
          cohorts). Single-cohort case has the slider under the donut
          block at the section level. Cyan track uses the brand cyan
          (#9CF0FF) to match the donut arc. */}
      {showSliderInRow && creator.role === "cohost" && onSplitCommit && canManageCollaboration && (
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
          <div className="relative flex-1 flex items-center" style={{ height: 24 }}>
            <div
              className="absolute inset-0 my-auto rounded-full pointer-events-none"
              style={{
                height: 6,
                background: `linear-gradient(to right,
                  #FF6130 0%,
                  #FF6130 ${100 - splitLocal}%,
                  #9CF0FF ${100 - splitLocal}%,
                  #9CF0FF 100%)`,
              }}
            />
            <input
              type="range"
              min={1}
              max={99}
              value={100 - splitLocal}
              onChange={(e) => {
                splitDirty.current = true;
                const ownerPct = parseInt(e.target.value);
                setSplitLocal(100 - ownerPct);
              }}
              onMouseUp={() => {
                if (splitLocal !== displayedSplit) onSplitCommit(splitLocal);
                splitDirty.current = false;
              }}
              onTouchEnd={() => {
                if (splitLocal !== displayedSplit) onSplitCommit(splitLocal);
                splitDirty.current = false;
              }}
              className="dual-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
              style={{ outline: "none" }}
            />
          </div>
          <div className="shrink-0 flex items-baseline gap-1 font-black font-headline" style={{ minWidth: 80, justifyContent: "flex-end" }}>
            <span className="text-sm" style={{ color: "#FF6130" }}>{100 - splitLocal}%</span>
            <span className="text-xs" style={{ color: "#94a3b8" }}>/</span>
            <span className="text-sm" style={{ color: "#0891b2" }}>{splitLocal}%</span>
          </div>
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

// ─────────────────────────────────────────────────────────────────
// TeamDonut — hero visual for The Team section. A weighty circular
// chart with the split rendered as proportional arcs in role colours.
// Built inline (not via the generic ShareDonut component) so we can
// scale the radius / stroke properly at size 240 and put a "TEAM · N"
// anchor in the centre. Legend lives outside the donut in TeamSection.
// ─────────────────────────────────────────────────────────────────

interface TeamDonutProps {
  /** Each segment uses `visualColor` for the arc fill (the bright
   *  brand cyan for cohorts, orange for owner). The darker `color`
   *  field — used for readable text in the legend — is intentionally
   *  not consumed here. */
  segments: Array<{ id: string; visualColor: string; percent: number }>;
  totalCount: number;
  size?: number;
}

function TeamDonut({ segments, totalCount, size = 240 }: TeamDonutProps) {
  const center = size / 2;
  const stroke = Math.round(size * 0.13); // proportional weight; 240 → 31
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // SVG circle dasharray + offset trick: each segment is a partially-
  // visible stroked circle, rotated by the running sum of prior
  // percentages so they butt up cleanly. Start at 12 o'clock.
  let runningOffset = 0;

  return (
    <div className="shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Soft background ring — visible behind any rounding gaps */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(15,34,41,0.05)"
          strokeWidth={stroke}
        />
        {segments.map((seg) => {
          const dashLength = (seg.percent / 100) * circumference;
          const dashGap = circumference - dashLength;
          const offset = -runningOffset * (circumference / 100) + circumference * 0.25;
          runningOffset += seg.percent;
          return (
            <circle
              key={seg.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.visualColor}
              strokeWidth={stroke}
              strokeDasharray={`${dashLength} ${dashGap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease" }}
            />
          );
        })}
        {/* Centre anchor — "N" big, "creators" small below */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          style={{
            fontWeight: 900,
            fontSize: Math.round(size * 0.2),
            fill: "#0F2229",
          }}
        >
          {totalCount}
        </text>
        <text
          x={center}
          y={center + Math.round(size * 0.1)}
          textAnchor="middle"
          style={{
            fontWeight: 700,
            fontSize: Math.round(size * 0.05),
            fill: "#94a3b8",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {totalCount === 1 ? "creator" : "creators"}
        </text>
      </svg>
    </div>
  );
}

