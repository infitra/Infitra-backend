/**
 * mapSnapshot — Bundle 5b.
 *
 * Maps the raw load_experience_space RPC result (snake_case envelope, camelCase
 * inner objects) into the store's ExperienceSpaceState shape. Pure (no React /
 * no client APIs) so BOTH the server page (initial seed) and the client
 * reconcile use the identical mapping.
 */

import type {
  ExperienceSpaceState,
  ExperienceSummary,
  ExperienceViewer,
  ExperienceProgress,
  ProgramState,
  SpaceCreator,
  SpaceSession,
  TribeMember,
  ActionItem,
} from "./store";

export interface RawExperienceSpaceSnapshot {
  authorized?: boolean;
  is_creator?: boolean;
  is_owner?: boolean;
  is_member?: boolean;
  space_id?: string;
  viewer?: ExperienceViewer;
  progress?: ExperienceProgress | null;
  experience?: ExperienceSummary;
  program_state?: ProgramState | null;
  creators?: SpaceCreator[];
  sessions?: SpaceSession[];
  members?: TribeMember[];
  member_count?: number;
  action_items?: ActionItem[];
}

export type ExperienceSpaceSeed = Omit<ExperienceSpaceState, "ui">;

export function mapSnapshot(
  raw: RawExperienceSpaceSnapshot | null,
  currentUserId: string,
): ExperienceSpaceSeed | null {
  if (!raw || !raw.authorized || !raw.experience || !raw.space_id) return null;
  return {
    experience: raw.experience,
    spaceId: raw.space_id,
    currentUserId,
    viewer: raw.viewer ?? {
      id: currentUserId,
      name: "You",
      avatar: null,
      joinedAt: null,
      postCount: 0,
    },
    isCreator: raw.is_creator ?? false,
    isOwner: raw.is_owner ?? false,
    isMember: raw.is_member ?? false,
    programState: raw.program_state ?? null,
    creators: raw.creators ?? [],
    sessions: raw.sessions ?? [],
    members: raw.members ?? [],
    memberCount: raw.member_count ?? 0,
    actionItems: raw.action_items ?? [],
    progress: raw.progress ?? null,
  };
}
