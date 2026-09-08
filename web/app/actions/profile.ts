"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const displayName = (formData.get("display_name") as string)?.trim();

  if (!displayName || displayName.length < 2) {
    return { error: "Display name must be at least 2 characters." };
  }
  if (displayName.length > 50) {
    return { error: "Display name must be under 50 characters." };
  }

  // Read role up front. Role is immutable after signup (trigger sets it from
  // auth metadata), so this is the source of truth even if the client's UI
  // state was mis-set.
  const { data: profile } = await supabase
    .from("app_profile")
    .select("role, workspace_enabled")
    .eq("id", user.id)
    .single();
  const isCreator = profile?.role === "creator" || profile?.role === "admin";

  // Accounts-lite (6 Sep 2026): a creator no longer attests a legal name at
  // onboarding. The signing identity is collected on the first workspace
  // visit (attestSigningIdentity), so joining the founding network costs
  // nothing binding. Invited creators already carry a display name from the
  // invite form and skip this page; expert or studio is chosen on the card.
  const { error } = await supabase
    .from("app_profile")
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const cookieStore = await cookies();
  cookieStore.set("x-onboarded", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (!isCreator) redirect("/");
  redirect(profile?.workspace_enabled ? "/dashboard" : "/network");
}

/**
 * The signing identity, collected once on the first workspace visit (6 Sep
 * 2026; it used to be part of creator onboarding). Every collaboration
 * contract from this creator onward renders with it. Only reachable when the
 * founder has enabled the workspace; the dashboard layout gates on the row.
 */
export async function attestSigningIdentity(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const legalName = (formData.get("legal_name") as string)?.trim();
  const attested = formData.get("attested") === "on";

  if (!legalName || legalName.length < 2) {
    return { error: "Legal name must be at least 2 characters." };
  }
  if (legalName.length > 100) {
    return { error: "Legal name must be under 100 characters." };
  }
  if (!attested) {
    return { error: "Please confirm this is your legal name." };
  }

  const { data: profile } = await supabase
    .from("app_profile")
    .select("role, workspace_enabled")
    .eq("id", user.id)
    .single();
  const isCreator = profile?.role === "creator" || profile?.role === "admin";
  if (!isCreator || !profile?.workspace_enabled) {
    return { error: "The workspace is not open for this account yet." };
  }

  const { error } = await supabase.from("app_creator_contract_identity").upsert(
    {
      creator_id: user.id,
      party_type: "individual",
      contract_name: legalName,
      authority_attested: true,
    },
    { onConflict: "creator_id" },
  );
  if (error) return { error: `Could not save signing identity: ${error.message}` };

  // The gate lives in the dashboard layout. Without this, the redirect to
  // the same URL is served from the router cache and the form shows again
  // although the row was written (seen 7 Sep 2026).
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

/**
 * The founding-network card, written in one go (8 Sep 2026): the profile
 * (name, one line, city, a few lines, photo URL) and the card
 * (expert or studio, what you bring, who you would want next to you).
 * Joining flips the card live; the database stamps community_consent_at.
 * There is no visibility choice and no posts switch: on infitra.fit, in the
 * network and in INFITRA's posts is the deal, stated on the form.
 *
 * Client + RLS surface: profile-class writes under the caller's own row
 * policies, the same path the profile editor uses. Pages that show cards
 * are revalidated so a new card appears without waiting for ISR.
 */
export async function joinFoundingNetwork(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const mode = formData.get("mode") === "edit" ? "edit" : "join";
  const text = (name: string, max: number) =>
    ((formData.get(name) as string) ?? "").trim().slice(0, max);

  const displayName = text("display_name", 50);
  if (displayName.length < 2) return { error: "Please enter a name of at least 2 characters." };
  const tagline = text("tagline", 120);
  const bio = text("bio", 2000);
  const city = text("city", 60);
  const brings = text("brings", 200);
  const seeks = text("seeks", 200);
  if (!brings || !seeks) {
    return {
      error: "Please fill in both card fields: what you bring, and who you would want next to you.",
    };
  }
  const entityRaw = text("entity_type", 10);
  if (entityRaw !== "expert" && entityRaw !== "studio") {
    return { error: "Please choose expert or studio." };
  }

  const avatarUrl = text("avatar_url", 500);
  if (avatarUrl && !avatarUrl.includes(`/storage/v1/object/public/profile-images/${user.id}/`)) {
    return { error: "Invalid photo path." };
  }

  const { data: profile } = await supabase
    .from("app_profile")
    .select("role, profile_facts")
    .eq("id", user.id)
    .single();
  const isCreator = profile?.role === "creator" || profile?.role === "admin";
  if (!isCreator) return { error: "The founding network is for experts and studios." };

  // City lives in profile_facts next to the other optional facts, which the
  // card does not ask for and leaves untouched.
  const facts = { ...((profile?.profile_facts as Record<string, unknown> | null) ?? {}) };
  if (city) facts.city = city;
  else delete facts.city;

  const updates: Record<string, unknown> = {
    display_name: displayName,
    tagline: tagline || null,
    bio: bio || null,
    profile_facts: facts,
    entity_type: entityRaw,
    brings,
    seeks,
    community_visibility: "public",
    updated_at: new Date().toISOString(),
  };
  if (avatarUrl) updates.avatar_url = avatarUrl;

  const { error } = await supabase.from("app_profile").update(updates).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/network");
  revalidatePath("/founding-network");
  revalidatePath("/");
  redirect(mode === "join" ? "/network?joined=1" : "/network");
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

  // The avatar is uploaded via the upload_image edge function (service role);
  // here we persist the resulting URL, guarded to the user's own folder so a
  // client can't point avatar_url at an arbitrary image.
  const avatarUrl = (formData.get("avatar_url") as string)?.trim();
  if (avatarUrl) {
    if (!avatarUrl.includes(`/storage/v1/object/public/profile-images/${user.id}/`)) {
      return { error: "Invalid photo path." };
    }
    updates.avatar_url = avatarUrl;
  }

  // Optional human facts (P7). Sent as ONE json field so the caller can
  // clear a value simply by omitting it: fill = share, empty = invisible.
  // Server-validated because this is a direct client-driven profile write.
  const factsRaw = (formData.get("profile_facts") as string)?.trim();
  if (factsRaw) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(factsRaw) as Record<string, unknown>;
    } catch {
      return { error: "Could not read your profile details." };
    }
    const facts: Record<string, unknown> = {};
    const age = Number(parsed.age);
    if (Number.isInteger(age) && age >= 13 && age <= 120) facts.age = age;
    if (typeof parsed.city === "string" && parsed.city.trim()) {
      facts.city = parsed.city.trim().slice(0, 60);
    }
    const since = Number(parsed.training_since);
    if (Number.isInteger(since) && since >= 1950 && since <= 2100) {
      facts.training_since = since;
    }
    if (Array.isArray(parsed.disciplines)) {
      const ds = parsed.disciplines
        .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
        .map((d) => d.trim().slice(0, 40))
        .slice(0, 8);
      if (ds.length > 0) facts.disciplines = ds;
    }
    if (typeof parsed.focus === "string" && parsed.focus.trim()) {
      facts.focus = parsed.focus.trim().slice(0, 120);
    }
    updates.profile_facts = facts;
  }

  // Nothing filled — treat as a no-op success (they hit "Later" on everything).
  if (Object.keys(updates).length === 0) return { success: true };

  updates.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from("app_profile")
    .update(updates)
    .eq("id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}
