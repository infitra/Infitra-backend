"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const displayName = (formData.get("display_name") as string)?.trim();

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!["participant", "creator"].includes(role)) return { error: "Please select a role." };
  if (!displayName || displayName.length < 2) return { error: "Display name must be at least 2 characters." };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.infitra.fit";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Role and display_name are passed as metadata so the DB trigger
      // can set them correctly on INSERT — role is immutable after creation.
      data: { role, display_name: displayName },
    },
  });

  if (error) return { error: error.message };

  // Profile row now has the correct role and display_name from the trigger.
  // Skip onboarding — go straight to the right home.
  redirect(role === "creator" ? "/dashboard" : "/discover");
}

export async function signIn(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
