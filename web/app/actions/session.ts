"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Creates a blank draft session with sensible defaults and redirects to the edit page. */
export async function createDraftSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const { data, error } = await supabase
    .from("app_session")
    .insert({
      title: "Untitled Session",
      start_time: tomorrow.toISOString(),
      duration_minutes: 60,
      price_cents: 0,
      currency: "CHF",
      host_id: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/dashboard/sessions/${data.id}`);
}

/** Updates a draft session. Only works on drafts you own (RLS enforced). */
export async function updateSession(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const sessionId = formData.get("session_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const durationMinutes = parseInt(formData.get("duration_minutes") as string);
  const capacityRaw = formData.get("capacity") as string;
  const capacity = capacityRaw ? parseInt(capacityRaw) : null;
  const priceRaw = formData.get("price") as string;
  const priceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : 0;

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
  if (priceCents < 0) {
    return { error: "Price cannot be negative." };
  }

  const startTime = new Date(`${date}T${time}`);
  if (isNaN(startTime.getTime())) {
    return { error: "Invalid date or time." };
  }
  if (startTime <= new Date()) {
    return { error: "Start time must be in the future." };
  }

  const { error } = await supabase
    .from("app_session")
    .update({
      title,
      description,
      start_time: startTime.toISOString(),
      duration_minutes: durationMinutes,
      capacity,
      price_cents: priceCents,
    })
    .eq("id", sessionId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };

  return { success: true, sessionId };
}

/** Publishes a draft session via the DB RPC (validates pricing, timing, etc.). */
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

  return { success: true };
}

/** Deletes a draft session. Only drafts can be deleted (RLS enforced). */
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
