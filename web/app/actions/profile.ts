"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSbClient } from "@supabase/supabase-js";

export async function completeOnboarding(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const displayName = (formData.get("display_name") as string)?.trim();
  const legalName = (formData.get("legal_name") as string)?.trim();
  const attested = formData.get("attested") === "on";

  if (!displayName || displayName.length < 2) {
    return { error: "Display name must be at least 2 characters." };
  }
  if (displayName.length > 50) {
    return { error: "Display name must be under 50 characters." };
  }

  // Read role up front so we know whether to collect legal name + attestation.
  // Role is immutable after signup (trigger sets it from auth metadata), so
  // this is the source of truth even if the client's UI state was mis-set.
  const { data: profile } = await supabase
    .from("app_profile")
    .select("role")
    .eq("id", user.id)
    .single();
  const isCreator = profile?.role === "creator";

  if (isCreator) {
    if (!legalName || legalName.length < 2) {
      return { error: "Legal name must be at least 2 characters." };
    }
    if (legalName.length > 100) {
      return { error: "Legal name must be under 100 characters." };
    }
    if (!attested) {
      return { error: "Please confirm this is your legal name." };
    }

    // Write the signing identity BEFORE the profile update so the contract
    // engine has everything it needs the moment onboarding finishes. If this
    // fails, we haven't touched the profile yet — user can retry cleanly.
    const { error: identityError } = await supabase
      .from("app_creator_contract_identity")
      .upsert(
        {
          creator_id: user.id,
          party_type: "individual",
          contract_name: legalName,
          authority_attested: true,
        },
        { onConflict: "creator_id" },
      );

    if (identityError) {
      return { error: `Could not save signing identity: ${identityError.message}` };
    }
  }

  const { error } = await supabase
    .from("app_profile")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const cookieStore = await cookies();
  cookieStore.set("x-onboarded", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(isCreator ? "/dashboard" : "/");
}

/**
 * Participant-safe profile save used by the post-purchase "first moves" card.
 * Writes only what the user chose to fill — photo, display name, and profile
 * visibility — and returns a result so the client controls navigation. Every
 * field is optional. Used by the post-purchase "first moves" card and the /me
 * participant profile editor; avatars are uploaded client-side, this persists
 * the resulting URL (guarded to the user's own folder).
 *
 * visibility is public|private; the DB CHECK forces creators to stay public,
 * so the toggle is effectively participant-only (creators never see this card).
 */
export async function saveFirstMoves(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const updates: Record<string, any> = {};

  const displayName = (formData.get("display_name") as string)?.trim();
  if (displayName) {
    if (displayName.length < 2 || displayName.length > 50) {
      return { error: "Display name must be 2–50 characters." };
    }
    updates.display_name = displayName;
  }

  const visibility = (formData.get("visibility") as string)?.trim();
  if (visibility === "public" || visibility === "private") {
    updates.visibility = visibility;
  }

  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 5 * 1024 * 1024) return { error: "Photo must be under 5MB." };
    // The @supabase/ssr server client carries the user's session for DB writes
    // but NOT for storage uploads — those reach storage as `anon` and the
    // bucket's authenticated-only INSERT policy rejects them ("new row violates
    // row-level security policy"). Forward the user's access token explicitly so
    // the storage request is authenticated as them; the path is their own folder
    // (matches profile_images_user_insert). This sidesteps the ssr/browser
    // session→storage propagation gap entirely.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { error: "Your session expired — please sign in again." };
    const authed = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const bytes = new Uint8Array(await avatarFile.arrayBuffer());
    const { error: upErr } = await authed.storage
      .from("profile-images")
      .upload(path, bytes, { upsert: true, contentType: avatarFile.type });
    if (upErr) return { error: `Photo upload failed: ${upErr.message}` };
    const base = authed.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
    // cache-bust so a re-uploaded photo (same path, upsert) refreshes in the browser
    updates.avatar_url = `${base}?v=${Date.now()}`;
  }

  // Nothing filled — treat as a no-op success (they hit "Later" on everything).
  if (Object.keys(updates).length === 0) return { success: true };

  updates.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from("app_profile")
    .update(updates)
    .eq("id", user.id);
  if (error) return { error: error.message };
  return { success: true, avatar_url: (updates.avatar_url as string | undefined) ?? null };
}
