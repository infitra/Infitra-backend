"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates a standalone session and publishes it atomically.
 * No persistent drafts — the session goes from form → published in one step.
 * If publish validation fails, the draft is deleted and errors are returned.
 */
export async function createAndPublishSession(
  prevState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const title = (formData.get("title") as string)?.trim();
  const description =
    (formData.get("description") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const durationMinutes = parseInt(formData.get("duration_minutes") as string);
  const capacityRaw = formData.get("capacity") as string;
  const capacity = capacityRaw ? parseInt(capacityRaw) : null;
  const priceRaw = formData.get("price") as string;
  const priceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : 0;

  // ── Validation ──────────────────────────────────────────
  if (!title || title.length < 3) {
    return { error: "Title must be at least 3 characters." };
  }
  if (!date || !time) {
    return { error: "Date and time are required." };
  }
  if (!durationMinutes || durationMinutes < 5 || durationMinutes > 480) {
    return { error: "Duration must be between 5 and 480 minutes." };
  }
  if (capacity !== null && (capacity < 1 || capacity > 10000)) {
    return { error: "Capacity must be between 1 and 10,000." };
  }
  if (priceCents <= 0) {
    return { error: "Price must be greater than zero to publish." };
  }

  const startTime = new Date(`${date}T${time}`);
  if (isNaN(startTime.getTime())) {
    return { error: "Invalid date or time." };
  }
  if (startTime <= new Date()) {
    return { error: "Start time must be in the future." };
  }

  // ── Create draft ────────────────────────────────────────
  const { data: session, error: insertError } = await supabase
    .from("app_session")
    .insert({
      title,
      description,
      image_url,
      start_time: startTime.toISOString(),
      duration_minutes: durationMinutes,
      capacity,
      price_cents: priceCents,
      currency: "CHF",
      host_id: user.id,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  // ── Publish immediately ─────────────────────────────────
  const { data, error: rpcError } = await supabase.rpc("publish_session", {
    p_session: session.id,
    p_caller: user.id,
  });

  if (rpcError) {
    // Clean up the draft
    await supabase.from("app_session").delete().eq("id", session.id);
    return { error: rpcError.message };
  }

  const result = data as { ok: boolean; errors?: string[] };
  if (!result.ok) {
    // Clean up the draft
    await supabase.from("app_session").delete().eq("id", session.id);
    return {
      error: result.errors?.join(", ") ?? "Cannot publish session.",
    };
  }

  redirect(`/dashboard/sessions/${session.id}`);
}

/** Publishes a draft session via the DB RPC. Used for challenge-linked sessions. */
export async function publishSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase.rpc("publish_session", {
    p_session: sessionId,
    p_caller: user.id,
  });

  if (error) return { error: error.message };

  const result = data as { ok: boolean; errors?: string[] };
  if (!result.ok) {
    return { error: result.errors?.join(", ") ?? "Cannot publish session." };
  }

  redirect(`/dashboard/sessions/${sessionId}`);
}

/** Deletes a session. Only drafts can be deleted (RLS enforced). */
export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_session")
    .delete()
    .eq("id", sessionId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };

  redirect("/dashboard/sessions");
}
