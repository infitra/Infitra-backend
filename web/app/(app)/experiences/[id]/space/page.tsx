import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { ExperienceSpaceShell } from "./ExperienceSpaceShell";
import { mapSnapshot, type RawExperienceSpaceSnapshot } from "@/lib/experienceSpace/mapSnapshot";

export const metadata = { title: "Experience Space — INFITRA" };
export const dynamic = "force-dynamic";

export default async function ExperienceSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // One consolidated round-trip (load_experience_space).
  const { data, error } = await supabase.rpc("load_experience_space", {
    p_challenge_id: id,
  });
  const seed = mapSnapshot(data as RawExperienceSpaceSnapshot | null, user.id);

  // Not authorized / no space yet → bounce to the dashboard. (Once 5d renames
  // the buyer route, this becomes the Experience's public page so a non-member
  // can join.)
  if (error || !seed) redirect("/dashboard");

  const { data: prof } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <ParticipantNav displayName={prof?.display_name ?? null} role={prof?.role} />
      <div className="pt-20">
        <ExperienceSpaceShell seed={seed} />
      </div>
    </div>
  );
}
