"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

/** Links a draft session to a draft challenge via RPC. */
export async function addSessionToChallenge(
  challengeId: string,
  sessionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("challenge_add_session", {
    p_challenge: challengeId,
    p_session: sessionId,
  });

  if (error) return { error: error.message };
  return { success: true };
}

/** Unlinks a session from a draft challenge via RPC. */
export async function removeSessionFromChallenge(
  challengeId: string,
  sessionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("challenge_remove_session", {
    p_challenge: challengeId,
    p_session: sessionId,
  });

  if (error) return { error: error.message };
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

  const { error } = await supabase
    .from("app_challenge")
    .delete()
    .eq("id", challengeId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  redirect("/dashboard/challenges");
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
      // Handle parameterized codes like "status_must_be_draft_current=published"
      const base = c.split("=")[0];
      return map[base] ?? c;
    })
    .join(" ");
}
