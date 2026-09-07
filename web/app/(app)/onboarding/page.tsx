import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = {
  title: "Get started — INFITRA",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, role, workspace_enabled")
    .eq("id", user.id)
    .single();

  // Already onboarded
  if (profile?.display_name) {
    const isCreator = profile.role === "creator" || profile.role === "admin";
    // Pilot: participants arrive via challenge URLs, no dedicated home yet.
    // Founding-network accounts live on /network until the founder
    // enables the workspace (6 Sep 2026).
    if (!isCreator) redirect("/");
    redirect(profile.workspace_enabled ? "/dashboard" : "/network");
  }

  return <OnboardingForm />;
}
