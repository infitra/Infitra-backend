import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { JoinNetworkForm } from "./JoinNetworkForm";

export const metadata = {
  title: "Your card · INFITRA",
  robots: { index: false },
};

const INK = "#0F2229";
const CYAN = "#0891b2";
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
          <div className="max-w-6xl mx-auto">
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

      {/* The stage: full bleed, one screen, the personal moment */}
      <section
        className="relative overflow-hidden pt-24 pb-12"
        style={{ background: "linear-gradient(135deg, #0C262E 0%, #103842 60%, #0C262E 100%)" }}
      >
        <div
          className="absolute -top-32 right-[10%] w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(156,240,255,0.16) 0%, rgba(156,240,255,0) 70%)" }}
        />
        <div
          className="absolute -bottom-48 -left-24 w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,97,48,0.22) 0%, rgba(255,97,48,0) 70%)" }}
        />

        <div className="relative max-w-6xl mx-auto px-6">
          {justJoined && (
            <div className="mb-8 max-w-2xl">
              {label("Founding network", CYAN_BRIGHT)}
              <h2
                className="text-3xl lg:text-4xl font-black font-headline tracking-tight mt-2 mb-2"
                style={{ color: CREAM, letterSpacing: "-0.03em" }}
              >
                You&apos;re in.
              </h2>
              <p className="text-base" style={{ color: "rgba(242,239,232,0.72)" }}>
                Welcome to the founding network. This is your card, as the network sees it.
              </p>
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] items-start">
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                {label(justJoined ? "Your card" : "Your card, as the network sees it", CYAN_BRIGHT)}
                <Link
                  href="/network/edit"
                  className="px-4 py-1.5 rounded-full text-[11px] font-bold font-headline uppercase tracking-[0.14em] whitespace-nowrap"
                  style={{ color: CREAM, border: "1px solid rgba(242,239,232,0.35)" }}
                >
                  Edit your card
                </Link>
              </div>
              <div style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.35)", borderRadius: 16 }}>
                <FoundingCard m={me} solid />
              </div>
            </div>

            <div className="min-w-0 lg:sticky lg:top-24">
              <div className="mb-5">{label("What happens next", ORANGE)}</div>
              <ol className="flex flex-col gap-5">
                {steps.map((step, i) => (
                  <li key={step.t} className="flex gap-4">
                    <span
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black font-headline"
                      style={{ backgroundColor: ORANGE, color: "#fff" }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-base font-black font-headline tracking-tight" style={{ color: CREAM }}>
                        {step.t}
                      </p>
                      <p className="text-sm leading-relaxed mt-1" style={{ color: "rgba(242,239,232,0.72)" }}>
                        {step.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-7 pt-6" style={{ borderTop: "1px solid rgba(242,239,232,0.15)" }}>
                <div className="mb-2">{label("Yours to keep", CYAN_BRIGHT)}</div>
                <p className="text-sm leading-relaxed font-bold font-headline" style={{ color: CREAM }}>
                  The founding member badge stays on your card when INFITRA opens publicly, and
                  founding cards hold the top spot in discovery.
                </p>
                <p className="text-sm leading-relaxed mt-1" style={{ color: "rgba(242,239,232,0.72)" }}>
                  Your audience stays yours, and your card can be withdrawn any time.
                </p>
              </div>

              {/* The door */}
              <Link
                href="/network/explore"
                className="mt-8 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-white/10"
                style={{ border: "1px solid rgba(156,240,255,0.35)", backgroundColor: "rgba(156,240,255,0.06)" }}
              >
                <span>
                  <span className="block text-sm font-black font-headline" style={{ color: CREAM }}>
                    Explore the network
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: "rgba(242,239,232,0.7)" }}>
                    {others.length === 0
                      ? "Forming now. Cards land there as experts and studios come in."
                      : "Everyone who is in, with what they bring and what would complement them."}
                  </span>
                </span>
                <span className="text-xl font-black" style={{ color: CYAN_BRIGHT }}>
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
