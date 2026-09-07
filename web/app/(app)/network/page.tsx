import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { ProfileEditForm, type ProfileFacts } from "@/app/components/ProfileEditForm";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { NetworkCardForm } from "./NetworkCardForm";

export const metadata = {
  title: "Founding network · INFITRA",
  robots: { index: false },
};

/**
 * /network — the founding network's home (6 Sep 2026).
 *
 * Not a room: a card and a directory. Top: your card, the real profile
 * (ProfileEditForm, reused wholesale) plus the one sentence and the
 * visibility choice. Below: everyone else with a members-or-public card.
 * The directory reads through load_founding_community(false), which
 * requires the caller's own card to be visible (reciprocity) or admin.
 */
export default async function NetworkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/network");

  const { data: profile } = await supabase
    .from("app_profile")
    .select(
      "role, display_name, tagline, bio, avatar_url, profile_facts, entity_type, collab_wish, community_visibility, workspace_enabled, is_admin",
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");
  const isCreator = profile.role === "creator" || profile.role === "admin";
  if (!isCreator) redirect("/me");
  if (!profile.display_name) redirect("/onboarding");

  const { data: directory } = await supabase.rpc("load_founding_community", {
    p_public_only: false,
  });
  const authorized: boolean = directory?.authorized === true;
  const members: FoundingMember[] = (directory?.members ?? []) as FoundingMember[];
  const others = members.filter((m) => m.id !== user.id);
  const count: number = Number(directory?.count ?? 0);

  const visibility = (profile.community_visibility ?? "none") as "none" | "members" | "public";

  return (
    <div className="min-h-screen">
      <ParticipantNav
        displayName={profile.display_name}
        role={profile.role}
        workspaceEnabled={profile.workspace_enabled}
      />

      <div className="pt-24 px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            <p
              className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
              style={{ color: "#0891b2" }}
            >
              Founding network
            </p>
            <h1
              className="text-3xl lg:text-4xl font-black font-headline tracking-tight mb-3"
              style={{ color: "#0F2229" }}
            >
              Your card, and who else is in.
            </h1>
            <p className="text-sm max-w-2xl" style={{ color: "#475569" }}>
              Experts and studios open to creating together. Your card is your profile plus one
              sentence: what you would love to run, and who you would want next to you. When two
              cards fit, Yves introduces you. Nothing binding, nothing to run.
            </p>
          </header>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mb-16">
            <div
              className="rounded-3xl p-6 lg:p-8"
              style={{
                backgroundColor: "rgba(255,255,255,0.62)",
                border: "1px solid rgba(15,34,41,0.08)",
              }}
            >
              <h2
                className="text-lg font-black font-headline tracking-tight mb-1"
                style={{ color: "#0F2229" }}
              >
                Your profile
              </h2>
              <p className="text-xs mb-6" style={{ color: "#64748b" }}>
                Photo, a few lines about your work, where you are, what you teach. This is the
                profile that fronts anything you build here later, so nothing is entered twice.
              </p>
              <ProfileEditForm
                displayName={profile.display_name}
                tagline={profile.tagline ?? ""}
                bio={profile.bio ?? ""}
                avatarUrl={profile.avatar_url ?? null}
                isCreator
                initialFacts={(profile.profile_facts ?? {}) as ProfileFacts}
              />
            </div>

            <div className="flex flex-col gap-6">
              <NetworkCardForm
                collabWish={profile.collab_wish ?? ""}
                entityType={(profile.entity_type ?? "expert") as "expert" | "studio"}
                visibility={visibility}
              />
              {!profile.workspace_enabled && (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: "rgba(255,97,48,0.06)",
                    border: "1px solid rgba(255,97,48,0.18)",
                  }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: "#0F2229" }}>
                    <span className="font-bold font-headline">Building an experience starts with a conversation.</span>{" "}
                    When a card fits yours, Yves introduces you both, and if it clicks the
                    workspace opens for you: outline, page, live rooms and the split, set up
                    together.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-4 mb-5">
              <h2
                className="text-xl font-black font-headline tracking-tight"
                style={{ color: "#0F2229" }}
              >
                Who else is in
              </h2>
              <span className="text-xs font-headline font-bold" style={{ color: "#64748b" }}>
                {count} {count === 1 ? "card" : "cards"}
              </span>
            </div>

            {!authorized ? (
              <div
                className="rounded-2xl p-6 text-sm"
                style={{
                  backgroundColor: "rgba(8,145,178,0.06)",
                  border: "1px solid rgba(8,145,178,0.18)",
                  color: "#0F2229",
                }}
              >
                {count > 0
                  ? `${count} ${count === 1 ? "member has" : "members have"} a visible card. Make yours visible to the network above and you see them here.`
                  : "The directory fills as cards come in. Make yours visible to the network above and you will see every new card here."}
              </div>
            ) : others.length === 0 ? (
              <p className="text-sm" style={{ color: "#64748b" }}>
                You are the first visible card. The next ones appear here as they come in.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {others.map((m) => (
                  <div key={m.id} className="flex flex-col gap-2">
                    <FoundingCard m={m} />
                    <a
                      href={`mailto:yves@infitra.fit?subject=${encodeURIComponent(`Introduce me to ${m.display_name ?? "a founding member"}`)}`}
                      className="self-end text-[11px] font-bold font-headline uppercase tracking-[0.14em]"
                      style={{ color: "#0891b2" }}
                    >
                      Ask Yves for an intro
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
