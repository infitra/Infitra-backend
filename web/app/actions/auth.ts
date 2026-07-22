"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolvePostAuth } from "@/lib/auth/post-auth";

/**
 * Sign up.
 *
 * Bundle 4.1 changes:
 *   - When intent=buy:*, role is forced to "participant" (the buyer
 *     flow only makes sense for participants) and display_name is
 *     derived from the email-prefix if not provided. This collapses
 *     the signup form to email+password only, removing every field
 *     that doesn't matter at the moment of purchase.
 *   - Honors returnTo + intent so the user lands on Stripe checkout
 *     immediately after auth (see lib/auth/post-auth.ts).
 *
 * Note on email confirmation: this code path assumes Supabase's
 * "Confirm email" setting is OFF for the project. With confirm-on,
 * signUp returns no session and the user can't be redirected to
 * Stripe until they click the link. The product decision (per Bundle
 * 4.1 plan) is to defer email confirmation until AFTER purchase, so
 * the buy flow stays unbroken. The receipt-email/edge function can
 * handle confirmation-after-purchase as a follow-up.
 */
export async function signUp(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const intent = (formData.get("intent") as string | null) || null;
  const returnTo = (formData.get("returnTo") as string | null) || null;

  // Intent=buy short-circuits role + display_name. Everyone going through
  // the buy flow is a participant, and the display name is a synthetic
  // default they can change later (we use email-prefix as a sane starting
  // value — better than empty, doesn't expose the full email).
  const isBuyFlow = intent?.startsWith("buy:") ?? false;

  let role: string;
  let displayName: string;

  if (isBuyFlow) {
    role = "participant";
    displayName = email.split("@")[0]?.slice(0, 50) || "Participant";
  } else {
    role = formData.get("role") as string;
    displayName = (formData.get("display_name") as string)?.trim() ?? "";
  }

  // Real name — captured only on the official (non-buy) participant signup.
  // Buyers skip it (we lean on Stripe's billing name); creators use the brand
  // Display Name field instead. app_handle_new_user persists full_name from
  // metadata when present.
  const fullName = (formData.get("full_name") as string)?.trim() || null;

  // The public participant signup collects only the full name; derive the
  // shown-to-others default from its first word (changeable later).
  if (!displayName && role === "participant" && fullName) {
    displayName = fullName.split(/\s+/)[0]?.slice(0, 50) ?? "";
  }

  // Supply-side gate (pilot): creator accounts exist ONLY via a single-use
  // invite (see app_handle_new_user — the DB trigger is the enforcement;
  // this pre-check exists for friendly errors before the account attempt).
  const inviteCode = (formData.get("creator_invite_code") as string | null)?.trim() || null;

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!["participant", "creator"].includes(role)) return { error: "Please select a role." };
  if (!displayName || displayName.length < 2) return { error: "Display name must be at least 2 characters." };

  if (role === "creator") {
    if (!inviteCode) {
      return { error: "Expert accounts are invite-only during the pilot. Use your personal invite link." };
    }
    const { data: inviteValid } = await supabase.rpc("app_validate_creator_invite", {
      p_code: inviteCode,
    });
    if (inviteValid !== true) {
      return { error: "This invite is invalid, already used, or expired. Reply to your acceptance email and we will send a fresh one." };
    }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.infitra.fit";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Forward intent + returnTo through the email-confirm callback so
      // that *if* confirmation is on, the post-confirm redirect still
      // honors the buy flow. Belt + suspenders.
      emailRedirectTo: buildCallbackUrl(origin, intent, returnTo),
      // Role and display_name are passed as metadata so the DB trigger
      // can set them correctly on INSERT — role is immutable after creation.
      // full_name is null except on the official participant signup.
      // creator_invite_code is redeemed atomically inside the trigger.
      data: {
        role,
        display_name: displayName,
        full_name: fullName,
        ...(role === "creator" && inviteCode ? { creator_invite_code: inviteCode } : {}),
      },
    },
  });

  if (error) {
    // The trigger ABORTS creator signups without a valid invite (better a
    // retry than a permanently wrong role). Supabase surfaces that as a
    // generic database error — translate it for the rare race where the
    // code was redeemed between our pre-check and the insert.
    if (role === "creator" && /database error/i.test(error.message)) {
      return { error: "This invite was just used or expired. Reply to your acceptance email and we will send a fresh one." };
    }
    return { error: error.message };
  }

  // Approved experts must never face the beta wall: their invite grants the
  // same cookie the /beta-access form sets. Participants stay walled until
  // the public go-live lifts the gate.
  if (role === "creator") {
    await grantBetaAccess();
  }

  // If Supabase auto-confirm is OFF, data.session will be null. In that
  // case fall back to role-default — we can't push the user to Stripe
  // without a session. The "check your email" UX should be handled by a
  // surface render when no session is present; for now we just go home.
  if (!data.session) {
    redirect(role === "creator" ? "/dashboard" : "/me");
  }

  // Auto-confirm ON (the pilot configuration) → we have a session, so
  // we can honor intent=buy and go straight to Stripe.
  const dest = await resolvePostAuth({
    supabase,
    user: data.user!,
    role: role as "creator" | "participant",
    intent,
    returnTo,
  });
  redirect(dest);
}

export async function signIn(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const intent = (formData.get("intent") as string | null) || null;
  const returnTo = (formData.get("returnTo") as string | null) || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch the role so resolvePostAuth picks the right default fallback.
  // We don't trust client-supplied role on sign-in.
  const { data: profile } = await supabase
    .from("app_profile")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // Creators and admins never face the beta wall (new device, expired
  // cookie): a successful sign-in re-plants the cookie for them. The wall
  // keeps gating participants until the public go-live.
  if (profile?.role === "creator" || profile?.role === "admin") {
    await grantBetaAccess();
  }

  const dest = await resolvePostAuth({
    supabase,
    user: data.user,
    role: (profile?.role as "creator" | "participant" | "admin" | null) ?? null,
    intent,
    returnTo,
  });
  redirect(dest);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear the onboarded cookie so proxy re-checks on next login
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("x-onboarded");

  redirect("/login");
}

/**
 * Plant the beta-wall cookie (same attributes as the /beta-access form).
 * Used for creator/admin flows only while the wall is up; retires with it.
 */
async function grantBetaAccess() {
  const code = process.env.BETA_ACCESS_CODE;
  if (!code) return; // wall already lifted — nothing to grant
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("x-beta-access", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

/**
 * Build the auth-callback URL that Supabase will redirect to after the
 * user clicks the confirm-email link. We tack intent + returnTo on so
 * the callback can resume the buy flow even when confirmation is on.
 */
function buildCallbackUrl(
  origin: string,
  intent: string | null,
  returnTo: string | null,
): string {
  const url = new URL(`${origin}/auth/callback`);
  if (intent) url.searchParams.set("intent", intent);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return url.toString();
}
