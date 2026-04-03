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

  const role = formData.get("role") as string;
  const displayName = (formData.get("display_name") as string)?.trim();

  if (!["participant", "creator"].includes(role)) {
    return { error: "Please select a valid role." };
  }

  if (!displayName || displayName.length < 2) {
    return { error: "Display name must be at least 2 characters." };
  }

  if (displayName.length > 50) {
    return { error: "Display name must be under 50 characters." };
  }

  const { error } = await supabase
    .from("app_profile")
    .update({
      role,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Set onboarded cookie so proxy skips DB check
  const cookieStore = await cookies();
  cookieStore.set("x-onboarded", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(role === "creator" ? "/dashboard" : "/discover");
}
