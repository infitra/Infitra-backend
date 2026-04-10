import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./ProfileEditForm";

export const metadata = {
  title: "Edit Profile — INFITRA",
};

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, tagline, bio, avatar_url, cover_image_url, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight mb-6">
        Edit Profile
      </h1>
      <ProfileEditForm
        displayName={profile.display_name ?? ""}
        tagline={profile.tagline ?? ""}
        bio={profile.bio ?? ""}
        avatarUrl={profile.avatar_url ?? null}
        coverUrl={profile.cover_image_url ?? null}
      />
    </div>
  );
}
