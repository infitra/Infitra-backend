import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { JoinNetworkForm } from "./JoinNetworkForm";

export const metadata = {
  title: "Founding network · INFITRA",
  robots: { index: false },
};

const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";
const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";

const PROFILE_COLUMNS =
  "role, display_name, tagline, bio, avatar_url, profile_facts, entity_type, brings, seeks, is_founding_expert, community_visibility, workspace_enabled, is_admin";

/**
 * /network — the founding network's home, two states (8 Sep 2026).
 *
 * No card yet: one form with the card taking shape next to it, one button,
 * and the card is live. Card exists: the arrival. The card on a dark stage
 * as the network sees it, what happens next, and everyone else who is in.
 * No page titles, like the rest of the app: the content carries its own
 * labels. The directory reads through load_founding_community(false), which
 * requires the caller's own card to be live (reciprocity) or admin.
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
                bio: profile.bio ?? "",
                avatarUrl: profile.avatar_url ?? null,
                city: facts.city ?? "",
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
      <div className="pt-20 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* The stage: the card as the network sees it, and what happens next. */}
          <section
            className="rounded-[32px] p-6 sm:p-8 lg:p-12 mb-14 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0C262E 0%, #103842 60%, #0C262E 100%)",
              boxShadow: "0 30px 80px rgba(12,38,46,0.25)",
            }}
          >
            <div
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(156,240,255,0.18) 0%, rgba(156,240,255,0) 70%)" }}
            />
            <div
              className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,97,48,0.22) 0%, rgba(255,97,48,0) 70%)" }}
            />

            {justJoined && (
              <div className="relative mb-8 max-w-2xl">
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

            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
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

              <div className="min-w-0">
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
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-baseline justify-between gap-4 flex-wrap">
              {label("Who else is in")}
              <p className="text-sm" style={{ color: "#64748b" }}>
                Experts and studios in the founding network, with what they bring and what would
                complement them.
              </p>
            </div>
            {others.length === 0 ? (
              <div
                className="rounded-3xl p-6 lg:p-8 max-w-2xl"
                style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.18)" }}
              >
                <p className="text-lg font-black font-headline tracking-tight mb-2" style={{ color: INK }}>
                  The founding network is forming.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                  You are among the first cards. The next ones land here as they come in, and we
                  introduce you the moment one fits yours.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {others.map((m) => (
                  <div key={m.id} className="flex flex-col gap-2">
                    <FoundingCard m={m} />
                    <a
                      href={`mailto:hello@infitra.fit?subject=${encodeURIComponent(`Intro request: ${m.display_name ?? "a founding member"}`)}`}
                      className="self-end text-[11px] font-bold font-headline uppercase tracking-[0.14em]"
                      style={{ color: CYAN }}
                    >
                      Ask for an intro
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
