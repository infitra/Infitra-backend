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

/** Action Bar item. Bundle 5 ships only `intro`; 6-9 add pre_pulse/reflection/question. */
export interface ActionItem {
  kind: string;
  introPrompt?: string;
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
  ui: { channelStatus: SpaceChannelStatus };
}

export interface ExperienceSpaceActions {
  /** Initial seed from the server (one-shot). */
  seed: (next: Omit<ExperienceSpaceState, "ui">) => void;
  /** Authoritative full overwrite on reconnect / tab-return (Phase-4 reconcile). */
  reconcile: (next: Omit<ExperienceSpaceState, "ui">) => void;
  setChannelStatus: (status: SpaceChannelStatus) => void;

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
  }));
}
