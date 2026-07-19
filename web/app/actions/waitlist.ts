"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Participant waitlist signup (landing finale — "The room is open.").
 * Anon-friendly like the pilot application: RLS on app_participant_waitlist
 * allows INSERT for any caller; the founder reads via admin role.
 *
 * Idempotent by design: re-signing up with a known email returns success —
 * we neither error nor leak whether an address is already on the list.
 */
export async function submitWaitlist(_prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  // Honeypot — real users never fill this hidden field.
  const website = (formData.get("website") as string | null)?.trim() ?? "";

  if (website.length > 0) return { success: true as const };

  if (!email || !email.includes("@") || email.length > 320) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_participant_waitlist")
    .insert({ email, source: "landing" });

  if (error) {
    // 23505 = unique_violation → already on the list; that's a success.
    if (error.code === "23505") return { success: true as const };
    console.error("[submitWaitlist] insert failed", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true as const };
}
