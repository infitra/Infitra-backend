"use client";

import { EditedAttribution } from "@/app/components/EditedAttribution";
import type { ActivityRow } from "./useWorkspaceRealtime";

/**
 * Per-section attribution chip — one per logical section card. Reads the
 * shared activity-log array (loaded by the page, kept fresh by Realtime
 * via useWorkspaceRealtime) and renders the latest matching entry as
 * `Edited 2h ago by Lara`.
 *
 * Each section passes its set of `field` values:
 *   - Challenge Details → ["title","description","start_date","end_date","price","image_url","capacity","challenge_details"]
 *   - The Promise       → ["promise_text"]
 *   - The Team          → ["cohost_added","cohost_removed","cohost_split","topic_ownership","session_cohost_added","session_cohost_removed"]
 *   - Program Rhythm    → ["weekly_focus","weekly_arc","session_added","session_edited","session_removed"]
 *   - Intro Prompt      → ["intro_prompt"]
 */

interface Props {
  fields: string[];
  activity: ActivityRow[];
  profiles: Record<string, { name: string; avatar: string | null }>;
}

export function SectionAttribution({ fields, activity, profiles }: Props) {
  // Find the most recent activity entry whose payload.field is in our set.
  // activity is already ordered DESC by created_at (page.tsx + Realtime).
  const fieldSet = new Set(fields);
  const latest = activity.find((row) => {
    const f = (row.payload as { field?: string } | null)?.field;
    return f ? fieldSet.has(f) : false;
  });

  if (!latest) return null;

  const editorName = profiles[latest.actor_id]?.name ?? null;
  return <EditedAttribution editedAt={latest.created_at} editorName={editorName} />;
}
