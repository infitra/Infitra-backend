"use server";

import { redirect } from "next/navigation";
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
