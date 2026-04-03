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
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  // Already onboarded
  if (profile?.display_name) {
    redirect(profile.role === "creator" ? "/dashboard" : "/discover");
  }

  return <OnboardingForm />;
}
