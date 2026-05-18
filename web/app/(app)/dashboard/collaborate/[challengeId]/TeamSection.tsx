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

  // Single-cohost slider state. Only the owner can drag the slider, so
  // most renders have NO local state — the donut/legend read directly
  // from the `splitPercent` prop (which the parent updates via
  // Realtime when the partner side changes). During an active drag the
  // owner gets smooth feedback by overriding with `draggedSplit`; once
  // the round-tripped server value catches up to the dragged value we
  // clear the override and resume reading from the prop.
  //
  // Why not the previous useSyncedField-style ref pattern? On the
  // cohost side it created a window where local state could get out
  // of sync with the prop, and the dep-array sync wasn't always
  // catching up — partner-driven changes weren't reflected in the
  // donut/legend on the cohost side. Keeping local state scoped to
  // the active-drag interaction removes the entire class of bug.
  const [draggedSplit, setDraggedSplit] = useState<number | null>(null);
  useEffect(() => {
    // Once the prop value matches the dragged value, the round-trip
    // is complete — clear the override.
    if (draggedSplit !== null && singleCohort?.splitPercent === draggedSplit) {
      setDraggedSplit(null);
    }
  }, [singleCohort?.splitPercent, draggedSplit]);

  const cohortSplit = draggedSplit ?? singleCohort?.splitPercent ?? 0;
  // Owner's percentage during a live drag (single-cohost only). For
  // multi-cohost cases the owner share comes straight from the prop.
  const liveOwnerSplit = singleCohort ? 100 - cohortSplit : ownerSplit;

  // Build the donut segments. Owner first (orange), cohorts after
  // (cyan). Two colours per segment: visualColor for fills (donut arc,
  // legend dot, slider track) using the bright brand cyan; color for
  // readable text (big % number, role label) using the darker cyan.
  // Polish v12.M.2: avatar carried on the segment so the legend can
  // show [%] [avatar] [name in role colour] — instantly links the
  // visual share to a face, and the role-coloured name carries the
  // role meaning without the OWNER/COHOST sub-label.
  type Segment = {
    id: string;
    name: string;
    avatar: string | null;
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
      avatar: ownerCreator.avatar ?? null,
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
      avatar: c.avatar ?? null,
      role: "Cohost",
      percent: singleCohort && c.id === singleCohort.id ? cohortSplit : c.splitPercent,
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

      {/* Polish v12.L.4: creator rows come FIRST now — people before
          money. The rows establish who is who (owner / cohost via the
          role label inside each row + the role-coloured details);
          THEN the donut block below shows the split. This way by the
          time the legend appears, the user already knows who's who,
          so the legend drops its "OWNER / COHOST" sub-labels and just
          shows `[%] [name]`. */}
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

      {/* Donut + simplified legend + (single-cohort) slider.
          Sits BELOW the rows now (polish v12.L.4). Legend dropped the
          OWNER / COHOST sub-labels — the rows above already establish
          that. % stays colour-coded (orange for owner, dark cyan for
          cohost) so the visual tie back to the rows is preserved.
          Polish v12.M.1: more breathing room around the block
          (mt-6 pt-6 → mt-10 pt-10, plus py-4 around the cluster) so
          the donut doesn't crowd the rows above or the section edge. */}
      <div className="mt-10 pt-10 pb-2" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
        <div className="flex items-center justify-evenly flex-wrap gap-x-10 gap-y-8 py-2">
          <TeamDonut segments={segments} size={240} />
          <div className="min-w-[280px] space-y-6">
            {segments.map((seg) => (
              <div key={seg.id} className="flex items-center gap-4">
                <span
                  className="text-4xl font-black font-headline leading-none"
                  style={{ color: seg.color, minWidth: 88 }}
                >
                  {seg.percent}%
                </span>
                {/* Polish v12.M.2: avatar between % and name. Faces ground
                    the percentage in a person, not an abstract slice. */}
                {seg.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={seg.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: `${seg.color}20` }}
                  >
                    <span className="text-xs font-black" style={{ color: seg.color }}>{seg.name[0]}</span>
                  </div>
                )}
                {/* Name colour-matched to the percentage — visually
                    grouped as one statement: "59% Yves 2" in orange. */}
                <p
                  className="text-base font-bold font-headline truncate leading-none"
                  style={{ color: seg.color }}
                >
                  {seg.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Slider — lives under the donut+legend so the control is
            adjacent to the visualization. Single-cohost only for now;
            multi-cohort case will get per-cohort sliders in the rows
            (deferred until the pilot needs >2 creator teams). */}
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
                    #FF6130 ${100 - cohortSplit}%,
                    #9CF0FF ${100 - cohortSplit}%,
                    #9CF0FF 100%)`,
                }}
              />
              <input
                type="range"
                min={1}
                max={99}
                value={100 - cohortSplit}
                onChange={(e) => setDraggedSplit(100 - parseInt(e.target.value))}
                onMouseUp={() => {
                  if (draggedSplit !== null && draggedSplit !== singleCohort.splitPercent) {
                    onCohostSplitCommit(singleCohort.id, draggedSplit);
                  }
                }}
                onTouchEnd={() => {
                  if (draggedSplit !== null && draggedSplit !== singleCohort.splitPercent) {
                    onCohostSplitCommit(singleCohort.id, draggedSplit);
                  }
                }}
                className="dual-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
                style={{ outline: "none" }}
                aria-label={`Revenue split between owner and ${singleCohort.name}`}
              />
            </div>
            <div className="shrink-0 flex items-baseline gap-1 font-black font-headline" style={{ minWidth: 90, justifyContent: "flex-end" }}>
              <span className="text-sm" style={{ color: "#FF6130" }}>{100 - cohortSplit}%</span>
              <span className="text-xs" style={{ color: "#94a3b8" }}>/</span>
              <span className="text-sm" style={{ color: "#0891b2" }}>{cohortSplit}%</span>
            </div>
          </div>
        )}
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
        backgroundColor: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(15,34,41,0.06)",
      }}
    >
      {/* Polish v12.M.3: row restructured to feel more like a person,
          less like a table cell.
          - Bigger avatar (w-11 → w-16) so faces register as humans.
          - Role label sits inline with "Leads N sessions" as one
            verbal phrase ("OWNER · Leads 4 sessions") instead of a
            separate loud sessions chip on the right.
          - Grid collapses from 4 cols to 3 cols (identity / topics
            / ×) — the dedicated sessions chip column is gone. */}
      <div className="grid items-center gap-4" style={{ gridTemplateColumns: "260px 1fr 32px" }}>
        {/* Identity column */}
        <div className="flex items-center gap-3 min-w-0">
          {creator.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar}
              alt=""
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${roleColor}20` }}
            >
              <span className="text-xl font-black font-headline" style={{ color: roleColor }}>
                {creator.name?.[0] ?? "?"}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-base font-bold font-headline truncate leading-tight" style={{ color: "#0F2229" }}>
              {creator.name}
            </p>
            <p className="text-[10px] font-bold font-headline uppercase tracking-wider mt-1">
              <span style={{ color: roleColor }}>{creator.role}</span>
              <span style={{ color: "#cbd5e1" }}>{" · "}</span>
              <span style={{ color: "#94a3b8" }}>
                Leads {creator.sessionCount} {creator.sessionCount === 1 ? "session" : "sessions"}
              </span>
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

        {/* (Sessions chip removed in polish v12.M.3 — session count is
            now part of the identity column's verbal role phrase:
            "OWNER · Leads 4 sessions". Frees the row from feeling
            like a roster table cell.) */}

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
        backgroundColor: "rgba(255,255,255,0.92)",
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
// scale the radius / stroke properly at size 240 and put a "REVENUE
// SHARE" label in the centre. Legend lives outside the donut in
// TeamSection. The creator count used to live in the centre but was
// dropped in polish v7: it's redundant with the legend on the right.
// ─────────────────────────────────────────────────────────────────

interface TeamDonutProps {
  /** Each segment uses `visualColor` for the arc fill (the bright
   *  brand cyan for cohorts, orange for owner). The darker `color`
   *  field — used for readable text in the legend — is intentionally
   *  not consumed here. */
  segments: Array<{ id: string; visualColor: string; percent: number }>;
  size?: number;
}

function TeamDonut({ segments, size = 240 }: TeamDonutProps) {
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
        {/* Centre label — "REVENUE / SHARE" stacked. The big creator
            count that used to live here was dropped in polish v7: the
            legend on the right shows the creators by name + role, so
            counting them in the donut centre was redundant. The label
            now NAMES what the donut is showing, which is the revenue
            split. Both lines use the same muted label style; the
            donut is allowed to be the visual headline on its own. */}
        <text
          x={center}
          y={center - Math.round(size * 0.015)}
          textAnchor="middle"
          style={{
            fontWeight: 800,
            fontSize: Math.round(size * 0.07),
            fill: "#94a3b8",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Revenue
        </text>
        <text
          x={center}
          y={center + Math.round(size * 0.085)}
          textAnchor="middle"
          style={{
            fontWeight: 800,
            fontSize: Math.round(size * 0.07),
            fill: "#94a3b8",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Share
        </text>
      </svg>
    </div>
  );
}

