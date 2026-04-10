"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(prevState: unknown, formData: FormData) {
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
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("profile-images")
      .upload(path, buffer, {
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
    const buffer = Buffer.from(await coverFile.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("profile-images")
      .upload(path, buffer, {
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
  revalidatePath("/dashboard/profile");
  return { success: true };
}

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

  // Only update display_name — role is immutable after account creation
  // and was set correctly by the trigger from signup metadata.
  const { error } = await supabase
    .from("app_profile")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Read role from profile to redirect correctly
  const { data: profile } = await supabase
    .from("app_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  const cookieStore = await cookies();
  cookieStore.set("x-onboarded", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(profile?.role === "creator" ? "/dashboard" : "/discover");
}
