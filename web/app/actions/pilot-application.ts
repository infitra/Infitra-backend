"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Pilot application submission. The form is anon-friendly — applicants
 * don't need an account. RLS on app_pilot_application allows INSERT
 * for any caller; the founder reads via admin role.
 *
 * Validates server-side (HTML required is not enough — a determined
 * caller can bypass it). Trims, normalizes email, drops empty optional
 * fields. Returns { error } on failure or { success: true } on success.
 */

export type PilotApplicationInput = {
  name: string;
  email: string;
  expertise: string;
  channel_url?: string;
  audience_size_range?: string;
  location?: string;
  has_partner?: boolean;
  partner_info?: string;
  complement_interest?: string;
  success_description?: string;
};

const ALLOWED_AUDIENCE_RANGES = new Set([
  "under_500",
  "500_to_2k",
  "2k_to_10k",
  "10k_to_50k",
  "over_50k",
]);

function normalizeOptional(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function submitPilotApplication(
  _prevState: unknown,
  formData: FormData
) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const expertise = (formData.get("expertise") as string | null)?.trim() ?? "";
  const channel_url = normalizeOptional(formData.get("channel_url") as string | null);
  const audience_size_range = normalizeOptional(formData.get("audience_size_range") as string | null);
  const location = normalizeOptional(formData.get("location") as string | null);
  const has_partner = formData.get("has_partner") === "yes";
  const partner_info = normalizeOptional(formData.get("partner_info") as string | null);
  const complement_interest = normalizeOptional(formData.get("complement_interest") as string | null);
  const success_description = normalizeOptional(formData.get("success_description") as string | null);

  if (name.length < 2) return { error: "Please enter your name." };
  if (name.length > 200) return { error: "Name is too long." };

  if (!email || !email.includes("@") || email.length > 320) {
    return { error: "Please enter a valid email address." };
  }

  if (expertise.length < 3) return { error: "Tell us your area of expertise." };
  if (expertise.length > 500) return { error: "Expertise description is too long." };

  if (audience_size_range && !ALLOWED_AUDIENCE_RANGES.has(audience_size_range)) {
    return { error: "Invalid audience size selection." };
  }

  // If has_partner is true, partner_info is recommended (not strictly required —
  // applicant might still be in conversation).
  // If has_partner is false, complement_interest gives us routing signal.

  if (has_partner && partner_info && partner_info.length > 1000) {
    return { error: "Partner description is too long." };
  }
  if (!has_partner && complement_interest && complement_interest.length > 1000) {
    return { error: "Complement interest description is too long." };
  }
  if (success_description && success_description.length > 2000) {
    return { error: "Success description is too long." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("app_pilot_application").insert({
    name,
    email,
    expertise,
    channel_url,
    audience_size_range,
    location,
    has_partner,
    partner_info: has_partner ? partner_info : null,
    complement_interest: has_partner ? null : complement_interest,
    success_description,
  });

  if (error) {
    // Don't leak DB error details to the user.
    console.error("[submitPilotApplication] insert failed", error);
    return { error: "Something went wrong submitting your application. Please try again." };
  }

  return { success: true as const };
}
