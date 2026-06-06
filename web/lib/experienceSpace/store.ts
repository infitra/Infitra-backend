/**
 * Experience-Space store — Bundle 5b.
 *
 * The client-side cache of the Experience Space (the participant locker room),
 * built natively on the Bundle 3.5 pattern: server seeds it from the
 * load_experience_space RPC, realtime payloads mutate it directly, and a
 * reconcile() heals drift after a reconnect. Reuses lib/realtime/useChannelHealth.
 *
 * Terminology (brand → internal schema, unchanged):
 *   Experience       = app_challenge
 *   Experience Space = app_challenge_space
 *   Tribe            = the people + the feed (app_challenge_post / members)
 *
 * The Tribe FEED is NOT in this store — it paginates + lives in its own
 * component (like the workspace chat). This store owns the structural slices:
 * experience, program state, creators, sessions, tribe members, action items.
 */

import { createStore, type StoreApi } from "zustand/vanilla";

export interface ExperienceSummary {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  priceCents: number;
  currency: string;
  promiseText: string | null;
  weeklyArc: { week: number; theme: string }[];
  topicOwnership: { creator_id: string; topics: string[] }[];
  introPrompt: string | null;
}

export interface ProgramState {
  currentWeek: number;
  totalWeeks: number;
  currentWeekTheme: string;
  weeksCompleted: number;
  weeksRemaining: number;
}

export interface SpaceCreator {
  id: string;
  name: string;
  avatar: string | null;
  role: "owner" | "cohost";
  tagline: string | null;
  bio: string | null;
}

export interface SpaceSession {
  id: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  liveRoomId: string | null;
  imageUrl: string | null;
  description: string | null;
  hostId: string;
  hostName: string;
  hostAvatar: string | null;
  cohosts: { id: string; name: string; avatar: string | null }[];
  /** Cohort pre-session pulse aggregate (count/avg, shown past a small floor). */
  prePulse?: { count: number; avg: number; canShow: boolean };
}

/** "Host & Co-host" label for a session — host first, then co-hosts. */
export function sessionTeamLabel(s: Pick<SpaceSession, "hostName" | "cohosts">): string {
  const names = [s.hostName, ...s.cohosts.map((c) => c.name)];
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export interface TribeMember {
  id: string;
  name: string;
  avatar: string | null;
}

/** The calling user, for the personalized header ("you in this experience"). */
export interface ExperienceViewer {
  id: string;
  name: string;
  avatar: string | null;
  joinedAt: string | null;
  postCount: number;
}

/** Personal progress for this experience (from vw_my_challenges_progress).
 *  Note: attendedSessions/completionPercent count entitlement, not turnout —
 *  the UI uses attendancePercent / attendedPastSessions / upcomingSessions /
 *  progressPercent, which are the meaningful "how am I doing" numbers. */
export interface ExperienceProgress {
  totalSessions: number;
  pastSessions: number;
  attendedSessions: number;
  attendedPastSessions: number;
  upcomingSessions: number;
  attendancePercent: number;
  completionPercent: number;
  progressPercent: number;
}

/** Hub → feed intent: which composer mode to open when jumping to the feed. */
export type ComposeIntent = "share" | "question" | null;

/** Creator console at-a-glance numbers (load_experience_creator_stats). */
export interface CreatorStats {
  pending: number;
  reflections: number;
}

/** Action Bar item. `intro` (B5), `pre_pulse` + `reflection` (B6/B7). */
export interface ActionItem {
  kind: string;
  introPrompt?: string;
  /** pre_pulse / reflection: the session the action is about. */
  sessionId?: string;
  sessionTitle?: string;
  /** pre_pulse: when the session starts (for the card copy). */
  startTime?: string;
  [key: string]: unknown;
}

export type SpaceChannelStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export interface ExperienceSpaceState {
  experience: ExperienceSummary;
  spaceId: string;
  currentUserId: string;
  viewer: ExperienceViewer;
  isCreator: boolean;
  isOwner: boolean;
  isMember: boolean;
  programState: ProgramState | null;
  creators: SpaceCreator[];
  sessions: SpaceSession[];
  members: TribeMember[];
  memberCount: number;
  actionItems: ActionItem[];
  progress: ExperienceProgress | null;
  ui: {
    channelStatus: SpaceChannelStatus;
    composeIntent: ComposeIntent;
    /** Creator-only at-a-glance numbers, server-seeded + refreshed live. */
    creatorStats: CreatorStats | null;
    /** Bumped by the feed's existing realtime channel on a question/comment —
     *  a cheap signal to re-fetch creatorStats without opening a 2nd channel. */
    feedActivity: number;
  };
}

export interface ExperienceSpaceActions {
  /** Initial seed from the server (one-shot). */
  seed: (next: Omit<ExperienceSpaceState, "ui">) => void;
  /** Authoritative full overwrite on reconnect / tab-return (Phase-4 reconcile). */
  reconcile: (next: Omit<ExperienceSpaceState, "ui">) => void;
  setChannelStatus: (status: SpaceChannelStatus) => void;
  /** Hub asks the feed composer to open in a given mode (share / question). */
  setComposeIntent: (intent: ComposeIntent) => void;
  /** Creator console: replace the at-a-glance numbers (after a live re-fetch). */
  setCreatorStats: (stats: CreatorStats) => void;
  /** Feed → "something happened" tick; the Shell re-fetches creatorStats on it. */
  bumpFeedActivity: () => void;

  /** app_session UPDATE → update a session's live/status fields in place. */
  applySessionUpdate: (row: {
    id: string;
    status?: string;
    live_room_id?: string | null;
    title?: string;
    start_time?: string;
    duration_minutes?: number;
  }) => void;
  /** Member joined/left → replace the members slice (enriched names come from reconcile). */
  applyMembers: (members: TribeMember[], count: number) => void;
  /** The current user posted their intro → drop the intro action card. */
  clearIntroAction: () => void;
  /** Drop a resolved action item (pre_pulse / reflection) by kind + session. */
  clearActionItem: (kind: string, sessionId: string) => void;
}

export type ExperienceSpaceStore = ExperienceSpaceState & ExperienceSpaceActions;

export function createExperienceSpaceStore(
  initial: ExperienceSpaceState,
): StoreApi<ExperienceSpaceStore> {
  return createStore<ExperienceSpaceStore>((set) => ({
    ...initial,

    seed: (next) => set(next),
    reconcile: (next) => set(next),
    setChannelStatus: (status) =>
      set((s) => ({ ui: { ...s.ui, channelStatus: status } })),
    setComposeIntent: (intent) =>
      set((s) => ({ ui: { ...s.ui, composeIntent: intent } })),
    setCreatorStats: (stats) =>
      set((s) => ({ ui: { ...s.ui, creatorStats: stats } })),
    bumpFeedActivity: () =>
      set((s) => ({ ui: { ...s.ui, feedActivity: s.ui.feedActivity + 1 } })),

    applySessionUpdate: (row) =>
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === row.id
            ? {
                ...sess,
                status: row.status ?? sess.status,
                liveRoomId:
                  row.live_room_id !== undefined ? row.live_room_id : sess.liveRoomId,
                title: row.title ?? sess.title,
                startTime: row.start_time ?? sess.startTime,
                durationMinutes: row.duration_minutes ?? sess.durationMinutes,
              }
            : sess,
        ),
      })),

    applyMembers: (members, count) => set(() => ({ members, memberCount: count })),

    clearIntroAction: () =>
      set((s) => ({ actionItems: s.actionItems.filter((a) => a.kind !== "intro") })),

    clearActionItem: (kind, sessionId) =>
      set((s) => ({
        actionItems: s.actionItems.filter(
          (a) => !(a.kind === kind && a.sessionId === sessionId),
        ),
      })),
  }));
}
