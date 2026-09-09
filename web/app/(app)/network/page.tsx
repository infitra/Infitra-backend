import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { JoinNetworkForm } from "./JoinNetworkForm";

export const metadata = {
  title: "Your card · INFITRA",
  robots: { index: false },
};

const ORANGE = "#FF6130";
const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";

const PROFILE_COLUMNS =
  "role, display_name, tagline, avatar_url, profile_facts, entity_type, brings, seeks, link_url, is_founding_expert, community_visibility, workspace_enabled, is_admin";

/**
 * /network — the member's own card, two states (8 Sep 2026).
 *
 * No card yet: one form with the card taking shape next to it, one button,
 * and the card is live. Card exists: the personal moment, a full-bleed dark
 * stage under the nav with the card as the network sees it and what happens
 * next, and one door at its foot to /network/explore, where everyone's
 * cards live. No page titles, like the rest of the app.
 */
export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/network");

  const { data: profile } = await supabase
    .from("app_profile")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");
  const isCreator = profile.role === "creator" || profile.role === "admin";
  if (!isCreator) redirect("/me");
  if (!profile.display_name) redirect("/onboarding");

  const { joined } = await searchParams;
  const live = profile.community_visibility === "public";
  const facts = (profile.profile_facts ?? {}) as { city?: string };

  const { data: directory } = await supabase.rpc("load_founding_community", {
    p_public_only: false,
  });
  const members: FoundingMember[] = (directory?.members ?? []) as FoundingMember[];
  const me = members.find((m) => m.id === user.id) ?? null;
  const others = members.filter((m) => m.id !== user.id);

  const nav = (
    <ParticipantNav
      displayName={profile.display_name}
      role={profile.role}
      workspaceEnabled={profile.workspace_enabled}
      isAdmin={profile.is_admin === true}
    />
  );

  const label = (text: string, color = "#64748b") => (
    <p className="text-[11px] font-bold font-headline uppercase tracking-[0.25em]" style={{ color }}>
      {text}
    </p>
  );

  if (!live || !me) {
    return (
      <div className="min-h-screen">
        {nav}
        <div className="pt-20 px-6 pb-16">
          <div className="max-w-7xl mx-auto">
            <JoinNetworkForm
              mode="join"
              initial={{
                id: user.id,
                displayName: profile.display_name,
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

            {others.length > 0 && (
              <section className="mt-16">
                <div className="mb-5">{label("Already in")}</div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {others.map((m) => (
                    <FoundingCard key={m.id} m={m} compact />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  const justJoined = joined === "1";
  const steps = [
    {
      t: "Your card is live.",
      d: "It will be displayed and visible on infitra.fit soon.",
    },
    {
      t: "The founding network is building up.",
      d: "We are bringing in experts and studios selectively, one by one.",
    },
    {
      t: "We come to you.",
      d: "When a card fits yours, you hear from us personally. If it is a fit on all sides, we open the workspace for you to collaborate and give you full access to the platform.",
    },
  ];

  return (
    <div className="min-h-screen">
      {nav}

      {/* The stage: full bleed, one screen, the personal moment. The same teal as the landing's dark sections. */}
      <section className="relative pt-24 pb-10 lg:min-h-screen" style={{ backgroundColor: "#0C262E" }}>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] items-start">
            <div className="min-w-0">
              <FoundingCard m={me} editHref="/network/edit" />
            </div>

            {/* Compact on purpose: the column, coming-soon block included, fits beside the card on one desktop screen */}
            <div className="min-w-0 lg:sticky lg:top-24 flex flex-col gap-7">
              {justJoined && <div className="lg:-mt-3.5">{label("Welcome to INFITRA", CYAN_BRIGHT)}</div>}
              <ol className="flex flex-col gap-3.5">
                {steps.map((step, i) => (
                  <li key={step.t} className="flex gap-3.5">
                    <span
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-black font-headline"
                      style={{ backgroundColor: ORANGE, color: "#fff" }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[15px] font-black font-headline tracking-tight leading-6" style={{ color: CREAM }}>
                        {step.t}
                      </p>
                      <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: "rgba(242,239,232,0.72)" }}>
                        {step.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="pt-7" style={{ borderTop: "1px solid rgba(242,239,232,0.15)" }}>
                <div className="mb-1.5">{label("Yours to keep", CYAN_BRIGHT)}</div>
                <p className="text-[13px] leading-relaxed font-bold font-headline" style={{ color: CREAM }}>
                  The founding member badge stays on your card when INFITRA opens publicly, and
                  founding cards hold the top spot in discovery. Your audience stays yours.
                </p>
              </div>

              {/* Coming soon: the network. Visible now, reachable once the page is designed. */}
              <div className="pt-7" style={{ borderTop: "1px solid rgba(242,239,232,0.15)" }}>
                <div
                  className="rounded-2xl p-4 relative overflow-hidden"
                  style={{ backgroundColor: "rgba(8,145,178,0.20)", border: "1px solid rgba(8,145,178,0.55)" }}
                >
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black font-headline uppercase tracking-[0.16em] mb-2 text-white"
                    style={{ backgroundColor: "#0891b2" }}
                  >
                    Coming soon
                  </span>
                  <p className="text-base font-black font-headline tracking-tight" style={{ color: CREAM }}>
                    Explore the network
                  </p>
                  <p className="text-[13px] leading-relaxed mt-1" style={{ color: "rgba(242,239,232,0.75)" }}>
                    Every card in the founding network in one place, with what each expert and studio
                    brings and what would complement them. Forming now, one card at a time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
