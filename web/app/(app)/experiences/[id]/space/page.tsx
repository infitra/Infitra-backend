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

  // Not authorized / no space yet → send to the Experience's public buyer page
  // so a non-member can see the offer and join (an enrolled user landing there
  // is redirected straight back into this space). This also covers the brief
  // window where a just-paid buyer arrives before the stripe webhook has
  // written their membership — they see the offer, not the creator dashboard.
  if (error || !seed) redirect(`/experiences/${id}`);

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
