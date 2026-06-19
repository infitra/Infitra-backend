"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Posts a system message into the workspace DM conversation for a challenge.
 * Reserved for collaboration milestones (invite sent, contract locked,
 * accepted, published) — events the cohost wants to see *in* the chat.
 *
 * Field-level edits (title, dates, sessions, etc.) go via
 * logWorkspaceFieldEdit instead, so the chat stays purely conversational.
 */
async function logWorkspaceMilestone(
  challengeId: string | undefined,
  body: string,
) {
  if (!challengeId) return;
  const supabase = await createClient();
  await supabase.rpc("post_workspace_log", {
    p_challenge_id: challengeId,
    p_body: body,
    p_metadata: {},
  });
}

/**
 * Records a field-level edit in the workspace activity log
 * (app_workspace_activity, not the chat thread). Drives the
 * "Recent changes ▾" expander next to the workspace chat in Bundle 3.
 *
 * `field` is a coarse identifier ('challenge_details', 'session_added',
 * 'session_removed', etc.). `oldValue` / `newValue` are optional —
 * pass null if the call site doesn't have the before/after values.
 */
async function logWorkspaceFieldEdit(
  challengeId: string | undefined,
  field: string,
  oldValue: unknown = null,
  newValue: unknown = null,
) {
  if (!challengeId) return;
  const supabase = await createClient();
  await supabase.rpc("log_workspace_field_edit", {
    p_challenge_id: challengeId,
    p_field: field,
    p_old: oldValue,
    p_new: newValue,
  });
}

/** Creates a blank draft challenge with sensible defaults and redirects to the edit page. */
export async function createDraftChallenge() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const endDate = new Date(nextWeek);
  endDate.setDate(endDate.getDate() + 28);

  const fmt = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("app_challenge")
    .insert({
      title: "Untitled Challenge",
      start_date: fmt(nextWeek),
      end_date: fmt(endDate),
      price_cents: 0,
      currency: "CHF",
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Pilot: all challenge editing happens in the collaboration workspace
  // (handles solo + collab on the same path). The /dashboard/challenges/ route
  // was deleted — workspace is the single edit surface.
  redirect(`/dashboard/collaborate/${data.id}`);
}

/**
 * Starts the next run of an experience — the creator-facing continuation entry
 * point. Clones the source (sessions, co-hosts + their splits, per-session hosts,
 * structure) into a draft via create_challenge_continuation_draft, stamps the
 * shared lineage (continuation_group_id), and drops the owner in the workspace to
 * adjust dates/details and publish through the normal flow. Owner-only (the RPC
 * enforces it). Default dates: the day after this run ends, for the same length —
 * the creator edits them in the workspace.
 */
export async function createContinuationDraft(sourceChallengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: src, error: srcErr } = await supabase
    .from("app_challenge")
    .select("start_date, end_date")
    .eq("id", sourceChallengeId)
    .single();
  if (srcErr || !src) throw new Error(srcErr?.message ?? "Experience not found");

  const dayMs = 24 * 60 * 60 * 1000;
  const srcStart = new Date(src.start_date as string);
  const srcEnd = new Date(src.end_date as string);
  const durationDays = Math.max(0, Math.round((srcEnd.getTime() - srcStart.getTime()) / dayMs));
  const start = new Date(srcEnd.getTime() + dayMs);
  const end = new Date(start.getTime() + durationDays * dayMs);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const { data: newId, error } = await supabase.rpc("create_challenge_continuation_draft", {
    p_source_challenge: sourceChallengeId,
    p_start_date: fmt(start),
    p_end_date: fmt(end),
  });
  if (error) throw new Error(error.message);

  redirect(`/dashboard/collaborate/${newId}`);
}

/**
 * Updates a draft challenge. Owner OR any cohost may edit while drafting and
 * before the contract is locked. Calls update_challenge_workspace (SECURITY
 * DEFINER) so the same path serves both roles. Locked-down columns
 * (owner_id, status, contract_id, currency) are not exposed by the RPC.
 */
export async function updateChallenge(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const challengeId = formData.get("challenge_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const description =
    (formData.get("description") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const capacityRaw = formData.get("capacity") as string;
  const capacity = capacityRaw ? parseInt(capacityRaw) : null;
  const priceRaw = formData.get("price") as string;
  const priceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : 0;

  // Bundle 2 additions — Promise + Weekly Arc + Topic Ownership + Intro
  // prompt. The current workspace UI doesn't surface these yet (Bundle 3
  // ships the editor), so they arrive as undefined and the RPC defaults
  // them to null (= leave existing value untouched). Once the form posts
  // these fields, no further server-action change is needed.
  const promiseTextRaw = formData.get("promise_text");
  const promiseText =
    promiseTextRaw === null ? undefined : (promiseTextRaw as string)?.trim() || null;

  const weeklyArcRaw = formData.get("weekly_arc");
  let weeklyArc: unknown = undefined;
  if (typeof weeklyArcRaw === "string" && weeklyArcRaw.length > 0) {
    try {
      weeklyArc = JSON.parse(weeklyArcRaw);
    } catch {
      return { error: "Weekly arc payload is malformed." };
    }
  }

  const topicOwnershipRaw = formData.get("topic_ownership");
  let topicOwnership: unknown = undefined;
  if (typeof topicOwnershipRaw === "string" && topicOwnershipRaw.length > 0) {
    try {
      topicOwnership = JSON.parse(topicOwnershipRaw);
    } catch {
      return { error: "Topic ownership payload is malformed." };
    }
  }

  const introPromptRaw = formData.get("intro_prompt");
  const introPrompt =
    introPromptRaw === null ? undefined : (introPromptRaw as string)?.trim() || null;

  if (!title || title.length < 3) {
    return { error: "Title must be at least 3 characters." };
  }
  if (!startDate || !endDate) {
    return { error: "Start date and end date are required." };
  }
  if (new Date(startDate) <= new Date()) {
    return { error: "Start date must be in the future." };
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return { error: "End date must be after start date." };
  }
  if (capacity !== null && (capacity < 1 || capacity > 10000)) {
    return { error: "Capacity must be between 1 and 10,000." };
  }
  if (priceCents < 0) {
    return { error: "Price cannot be negative." };
  }

  // Build RPC params; only include the new fields when they were posted,
  // so the RPC's "leave existing value" branch fires for older form
  // versions that don't include them.
  const rpcParams: Record<string, unknown> = {
    p_challenge_id: challengeId,
    p_title: title,
    p_description: description,
    p_image_url: image_url,
    p_start_date: startDate,
    p_end_date: endDate,
    p_capacity: capacity,
    p_price_cents: priceCents,
  };
  if (promiseText !== undefined) rpcParams.p_promise_text = promiseText;
  if (weeklyArc !== undefined) rpcParams.p_weekly_arc = weeklyArc;
  if (topicOwnership !== undefined) rpcParams.p_topic_ownership = topicOwnership;
  if (introPrompt !== undefined) rpcParams.p_intro_prompt = introPrompt;

  const { error } = await supabase.rpc("update_challenge_workspace", rpcParams);

  if (error) return { error: humanizeUpdateError(error.message) };

  // Field-edit log goes to the activity audit, not the chat thread.
  // The Bundle 3 polish auto-save sends a `changed_field` hint so each
  // blur logs precisely what changed (e.g. "promise_text", "weekly_focus").
  // Older callers without a hint fall back to the catch-all so legacy
  // code paths keep producing some attribution.
  const changedFieldRaw = formData.get("changed_field");
  const changedField =
    typeof changedFieldRaw === "string" && changedFieldRaw.length > 0
      ? changedFieldRaw
      : "challenge_details";
  await logWorkspaceFieldEdit(challengeId, changedField);
  return { success: true, challengeId };
}

function humanizeUpdateError(code: string): string {
  const map: Record<string, string> = {
    not_authenticated: "You need to be signed in.",
    challenge_not_found: "Challenge not found.",
    challenge_not_draft: "Only drafts can be edited.",
    challenge_locked: "The contract is locked — reactivate drafting to edit.",
    not_a_collaborator: "Only the owner or a cohost can edit this challenge.",
    title_too_short: "Title must be at least 3 characters.",
    dates_required: "Start date and end date are required.",
    end_before_start: "End date must be after start date.",
    capacity_out_of_range: "Capacity must be between 1 and 10,000.",
    invalid_price: "Price cannot be negative.",
  };
  // Postgres error messages may include extra context — match leading token.
  const key = code.split("\n")[0].trim();
  return map[key] ?? code;
}

/**
 * Polish v12.J: server-side guardrail — a session's `start_time` must
 * fall within its parent challenge's [start_date 00:00 UTC,
 * end_date 23:59:59.999 UTC] window. Defence in depth alongside the
 * client-side `min` / `max` on the datetime input. (A DB trigger on
 * `app_session` referencing the challenge dates is the canonical
 * non-bypassable guardrail per SR-I1 — flagged as a follow-up.)
 */
async function assertSessionWithinChallengeWindow(
  supabase: any,
  challengeId: string,
  startTime: string,
): Promise<string | null> {
  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("start_date, end_date")
    .eq("id", challengeId)
    .single();
  if (!challenge?.start_date || !challenge?.end_date) return null;
  const value = new Date(startTime).getTime();
  if (Number.isNaN(value)) return "Invalid session date.";
  const min = new Date(`${challenge.start_date}T00:00:00Z`).getTime();
  const max = new Date(`${challenge.end_date}T23:59:59.999Z`).getTime();
  if (value < min || value > max) {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `Session must fall within the program window (${fmt(challenge.start_date)} – ${fmt(challenge.end_date)}).`;
  }
  return null;
}

/** Creates a session inline within a challenge via create_challenge_session RPC. */
export async function createChallengeSession(
  challengeId: string,
  title: string,
  startTime: string,
  durationMinutes: number,
  imageUrl?: string | null,
  description?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  if (!title?.trim() || title.trim().length < 3) {
    return { error: "Session title must be at least 3 characters." };
  }
  if (!startTime) {
    return { error: "Session date and time are required." };
  }
  if (!durationMinutes || durationMinutes < 5 || durationMinutes > 480) {
    return { error: "Duration must be between 5 and 480 minutes." };
  }

  const windowError = await assertSessionWithinChallengeWindow(supabase, challengeId, startTime);
  if (windowError) return { error: windowError };

  const { data, error } = await supabase.rpc("create_challenge_session", {
    p_challenge_id: challengeId,
    p_title: title.trim(),
    p_start_time: startTime,
    p_duration_minutes: durationMinutes,
    p_price_cents: 0,
    p_currency: "CHF",
  });

  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  const sessionId = row?.session_id;

  // Update image_url and description on the created session if provided
  if (sessionId && (imageUrl || description)) {
    const updates: Record<string, any> = {};
    if (imageUrl) updates.image_url = imageUrl;
    if (description) updates.description = description;
    await supabase.from("app_session").update(updates).eq("id", sessionId);
  }

  await logWorkspaceFieldEdit(challengeId, "session_added", null, {
    session_id: sessionId,
    title: title.trim(),
  });
  return { success: true, sessionId };
}

/** Updates an inline challenge session (app_session row). RLS ensures only owner drafts. */
export async function updateChallengeSession(
  sessionId: string,
  title: string,
  startTime: string,
  durationMinutes: number,
  description?: string | null,
  imageUrl?: string | null,
  challengeId?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  if (!title?.trim() || title.trim().length < 3) {
    return { error: "Session title must be at least 3 characters." };
  }

  // Polish v12.J: defence-in-depth guardrail. If the caller passed a
  // challengeId we can look up its [start_date, end_date] and refuse
  // out-of-range start_times. Without challengeId we'd have to join
  // through app_challenge_session — skipped here since the workspace
  // always passes it (and a stricter DB trigger is the right home for
  // the can't-bypass version, planned as a follow-up).
  if (challengeId) {
    const windowError = await assertSessionWithinChallengeWindow(supabase, challengeId, startTime);
    if (windowError) return { error: windowError };
  }

  const updates: Record<string, any> = {
    title: title.trim(),
    start_time: startTime,
    duration_minutes: durationMinutes,
  };
  if (description !== undefined) updates.description = description;
  if (imageUrl !== undefined) updates.image_url = imageUrl;

  const { error } = await supabase
    .from("app_session")
    .update(updates)
    .eq("id", sessionId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };
  await logWorkspaceFieldEdit(challengeId, "session_edited", null, {
    session_id: sessionId,
    title: title.trim(),
  });
  return { success: true };
}

/** Removes a session from a challenge AND deletes the app_session row. */
export async function removeChallengeSession(
  challengeId: string,
  sessionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  // Single RPC that unlinks AND deletes the session in one transaction.
  // Sets app.via_rpc so the guard trigger allows both operations.
  const { error } = await supabase.rpc(
    "challenge_remove_session_and_delete",
    {
      p_challenge: challengeId,
      p_session: sessionId,
    }
  );

  if (error) return { error: error.message };

  await logWorkspaceFieldEdit(challengeId, "session_removed", { session_id: sessionId }, null);
  return { success: true };
}

/** Publishes a draft challenge via the DB RPC (validates pricing, sessions, etc.). */
export async function publishChallenge(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase.rpc("publish_challenge", {
    p_challenge: challengeId,
    p_caller: user.id,
  });

  if (error) return { error: error.message };

  const result = data as { ok: boolean; errors?: string[] };
  if (!result.ok) {
    return {
      error: humanizeBlockers(result.errors ?? []),
    };
  }

  // Publish is a milestone — keep it in the chat thread (cohorts want
  // to see this conversationally, not buried in the activity log).
  await logWorkspaceMilestone(challengeId, "published the challenge");
  // Land on the celebration page for collaboration publishes (it handles the
  // party-membership check and renders a summary with a single CTA back to
  // the dashboard). Solo publishes also route here — the page reads fine
  // for a single-party "collaboration" too.
  redirect(`/dashboard/collaborate/${challengeId}/published`);
}

/** Deletes a draft challenge. Only drafts can be deleted (RLS enforced). */
export async function deleteChallenge(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  // First delete all linked sessions (they were created for this challenge only)
  const { data: linkedRows } = await supabase
    .from("app_challenge_session")
    .select("session_id")
    .eq("challenge_id", challengeId);

  // Delete the challenge (cascade removes app_challenge_session links)
  const { error } = await supabase
    .from("app_challenge")
    .delete()
    .eq("id", challengeId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  // Clean up orphaned session rows
  if (linkedRows?.length) {
    for (const row of linkedRows) {
      await supabase
        .from("app_session")
        .delete()
        .eq("id", row.session_id)
        .eq("host_id", user.id);
    }
  }

  redirect("/dashboard");
}

/** Updates a tribe space cover image (owner only). */
export async function updateTribeCover(spaceId: string, coverImageUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_challenge_space")
    .update({ cover_image_url: coverImageUrl })
    .eq("id", spaceId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/me`);
  return { success: true };
}

/* ── Helpers ─────────────────────────────────────────────── */

/** Maps DB blocker codes to human-readable messages. */
function humanizeBlockers(codes: string[]): string {
  const map: Record<string, string> = {
    challenge_not_found: "Challenge not found.",
    only_owner_can_publish: "Only the owner can publish this challenge.",
    start_date_missing: "Start date is required.",
    start_date_cannot_be_past: "Start date must be in the future.",
    price_must_be_positive: "Price must be greater than zero to publish.",
    not_enough_sessions_min_3:
      "At least 3 sessions are required to publish a challenge.",
    cohost_split_exceeds_100: "Cohost splits exceed 100%.",
    cohost_without_session:
      "A cohost has no linked session in the challenge.",
    contract_id_missing:
      "A collaboration contract is required for challenges with cohosts.",
    bound_contract_not_locked: "The collaboration contract is not locked.",
    contract_has_decline: "A collaborator has declined the contract.",
    challenge_cohosts_not_all_accepted_bound_contract:
      "Not all cohosts have accepted the contract.",
  };

  return codes
    .map((c) => {
      const base = c.split("=")[0];
      return map[base] ?? c;
    })
    .join(" ");
}
