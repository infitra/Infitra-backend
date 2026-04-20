"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(prevState: unknown, formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated." };

    const display_name = (formData.get("display_name") as string)?.trim();
    const tagline = (formData.get("tagline") as string)?.trim() || null;
    const bio = (formData.get("bio") as string)?.trim() || null;

    if (!display_name || display_name.length < 2) {
      return { error: "Display name must be at least 2 characters." };
    }

    // Handle avatar upload
    const avatarFile = formData.get("avatar") as File | null;
    let avatar_url: string | undefined;

    if (avatarFile && avatarFile.size > 0) {
      if (avatarFile.size > 5 * 1024 * 1024) {
        return { error: "Avatar must be under 5MB." };
      }
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const bytes = new Uint8Array(await avatarFile.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from("profile-images")
        .upload(path, bytes, {
          upsert: true,
          contentType: avatarFile.type,
        });
      if (upErr) return { error: `Avatar upload failed: ${upErr.message}` };
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(path);
      avatar_url = urlData.publicUrl;
    }

    // Handle cover image upload
    const coverFile = formData.get("cover") as File | null;
    let cover_image_url: string | undefined;

    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > 5 * 1024 * 1024) {
        return { error: "Cover image must be under 5MB." };
      }
      const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/cover.${ext}`;
      const bytes = new Uint8Array(await coverFile.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from("profile-images")
        .upload(path, bytes, {
          upsert: true,
          contentType: coverFile.type,
        });
      if (upErr) return { error: `Cover upload failed: ${upErr.message}` };
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(path);
      cover_image_url = urlData.publicUrl;
    }

    const updates: Record<string, any> = { display_name, tagline, bio };
    if (avatar_url) updates.avatar_url = avatar_url;
    if (cover_image_url) updates.cover_image_url = cover_image_url;

    const { error: updateError } = await supabase
      .from("app_profile")
      .update(updates)
      .eq("id", user.id);

    if (updateError) return { error: updateError.message };

    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (err: any) {
    // redirect() throws a special error — let it propagate
    if (err?.digest?.includes("NEXT_REDIRECT")) throw err;
    return { error: err?.message || "Something went wrong. Please try again." };
  }
}

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

  redirect(isCreator ? "/dashboard" : "/discover");
}
