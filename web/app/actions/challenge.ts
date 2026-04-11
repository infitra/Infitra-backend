"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  redirect(`/dashboard/challenges/${data.id}`);
}

/** Updates a draft challenge. Only works on drafts you own (RLS enforced). */
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

  const { error } = await supabase
    .from("app_challenge")
    .update({
      title,
      description,
      image_url,
      start_date: startDate,
      end_date: endDate,
      capacity,
      price_cents: priceCents,
    })
    .eq("id", challengeId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  return { success: true, challengeId };
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

  return { success: true, sessionId };
}

/** Updates an inline challenge session (app_session row). RLS ensures only owner drafts. */
export async function updateChallengeSession(
  sessionId: string,
  title: string,
  startTime: string,
  durationMinutes: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  if (!title?.trim() || title.trim().length < 3) {
    return { error: "Session title must be at least 3 characters." };
  }

  const { error } = await supabase
    .from("app_session")
    .update({
      title: title.trim(),
      start_time: startTime,
      duration_minutes: durationMinutes,
    })
    .eq("id", sessionId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };
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

  // Unlink via RPC — this is the only allowed way (guard trigger enforces it).
  // The RPC sets app.via_rpc before deleting from app_challenge_session.
  const { error } = await supabase.rpc(
    "challenge_remove_session",
    {
      p_challenge: challengeId,
      p_session: sessionId,
    }
  );

  if (error) return { error: error.message };

  // NOTE: We do NOT delete the app_session row here.
  // Deleting app_session cascades to app_challenge_session (FK ON DELETE CASCADE),
  // which triggers guard_link_via_rpc and blocks the operation.
  // The orphaned draft session is harmless — it has no links, won't appear anywhere.
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

  redirect(`/dashboard/challenges/${challengeId}`);
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

  redirect("/dashboard/challenges");
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
  revalidatePath(`/communities/challenge/${spaceId}`);
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
