import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { JoinNetworkForm } from "../JoinNetworkForm";

export const metadata = {
  title: "Edit your card · INFITRA",
  robots: { index: false },
};

/**
 * /network/edit — the same one-door form, saving an existing card. A member
 * without a card is sent to /network to make one.
 */
export default async function NetworkEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/network/edit");

  const { data: profile } = await supabase
    .from("app_profile")
    .select(
      "role, display_name, tagline, avatar_url, profile_facts, entity_type, brings, seeks, link_url, is_founding_expert, community_visibility, workspace_enabled, is_admin",
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");
  const isCreator = profile.role === "creator" || profile.role === "admin";
  if (!isCreator) redirect("/me");
  if (profile.community_visibility !== "public") redirect("/network");

  const facts = (profile.profile_facts ?? {}) as { city?: string };

  return (
    <div className="min-h-screen">
      <ParticipantNav
        displayName={profile.display_name}
        role={profile.role}
        workspaceEnabled={profile.workspace_enabled}
        isAdmin={profile.is_admin === true}
      />
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/network"
            className="inline-block text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-6"
            style={{ color: "#0891b2" }}
          >
            ← Back to your card
          </Link>

          <JoinNetworkForm
            mode="edit"
            initial={{
              id: user.id,
              displayName: profile.display_name ?? "",
              tagline: profile.tagline ?? "",
              avatarUrl: profile.avatar_url ?? null,
              city: facts.city ?? "",
              linkUrl: profile.link_url ?? "",
              entityType: (profile.entity_type ?? null) as "expert" | "studio" | null,
              brings: profile.brings ?? "",
              seeks: profile.seeks ?? "",
              isFoundingExpert: profile.is_founding_expert === true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
