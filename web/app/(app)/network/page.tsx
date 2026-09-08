import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";
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
 * and the card is live. Card exists: an arrival. The card on a dark stage as
 * the network sees it, what happens next in three steps, and everyone else
 * who is in. The directory reads through load_founding_community(false),
 * which requires the caller's own card to be live (reciprocity) or admin.
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
  const facts = (profile.profile_facts ?? {}) as { city?: string; disciplines?: string[] };

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

  const eyebrow = (
    <p
      className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
      style={{ color: CYAN }}
    >
      Founding network
    </p>
  );

  if (!live || !me) {
    return (
      <div className="min-h-screen">
        {nav}
        <div className="pt-24 px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10 max-w-3xl">
              {eyebrow}
              <h1
                className="text-3xl lg:text-5xl font-black font-headline tracking-tight mb-4"
                style={{ color: INK, letterSpacing: "-0.03em" }}
              >
                Make your card.
              </h1>
              <p className="text-base lg:text-lg" style={{ color: "#475569" }}>
                Experts and studios, open to creating live experiences together. Your card is how
                the network sees you and how we find you the right fit. It takes shape on the
                right as you go. A few minutes, then you are in.
              </p>
            </header>

            <JoinNetworkForm
              mode="join"
              initial={{
                id: user.id,
                displayName: profile.display_name,
                tagline: profile.tagline ?? "",
                bio: profile.bio ?? "",
                avatarUrl: profile.avatar_url ?? null,
                city: facts.city ?? "",
                disciplines: facts.disciplines ?? [],
                entityType: (profile.entity_type ?? null) as "expert" | "studio" | null,
                brings: profile.brings ?? "",
                seeks: profile.seeks ?? "",
                isFoundingExpert: profile.is_founding_expert === true,
              }}
            />

            {others.length > 0 && (
              <section className="mt-16">
                <h2 className="text-xl font-black font-headline tracking-tight mb-5" style={{ color: INK }}>
                  Already in
                </h2>
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

  return (
    <div className="min-h-screen">
      {nav}
      <div className="pt-24 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 max-w-3xl">
            {eyebrow}
            <h1
              className="text-4xl lg:text-6xl font-black font-headline tracking-tight mb-4"
              style={{ color: INK, letterSpacing: "-0.03em" }}
            >
              {justJoined ? "You're in." : "Your card."}
            </h1>
            <p className="text-base lg:text-lg" style={{ color: "#475569" }}>
              {justJoined
                ? "Your card is live on infitra.fit and in the network. The founding network is building up around it, and when a card fits yours, you hear from us."
                : "Live on infitra.fit and in the network. Keep it current: it is what we match on."}
            </p>
          </header>

          {/* The stage: the card as the network sees it, and what happens next. */}
          <section
            className="rounded-[32px] p-6 sm:p-8 lg:p-12 mb-16 relative overflow-hidden"
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

            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-4 mb-4">
                  <p
                    className="text-[11px] font-bold font-headline uppercase tracking-[0.25em]"
                    style={{ color: CYAN_BRIGHT }}
                  >
                    Your card, as the network sees it
                  </p>
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

              <div className="min-w-0 flex flex-col gap-8">
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: "rgba(156,240,255,0.08)",
                    border: "1px solid rgba(156,240,255,0.25)",
                  }}
                >
                  <p
                    className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
                    style={{ color: CYAN_BRIGHT }}
                  >
                    Yours to keep
                  </p>
                  <FoundingExpertBadge className="mb-3" />
                  <p className="text-sm leading-relaxed" style={{ color: CREAM }}>
                    The founding member badge stays on your card when INFITRA opens publicly, and
                    founding cards hold the top spot in discovery. Your audience stays yours, and
                    your card can be withdrawn any time.
                  </p>
                </div>

                <div>
                  <p
                    className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-5"
                    style={{ color: ORANGE }}
                  >
                    What happens next
                  </p>
                  <ol className="flex flex-col gap-5">
                    {[
                      {
                        t: "Your card is live.",
                        d: "It shows on infitra.fit and to everyone in the network. There is nothing more to do for now.",
                      },
                      {
                        t: "The founding network is building up.",
                        d: "We are bringing in experts and studios one by one, by hand. Introductions start once the right counterparts are in: weeks, not days.",
                      },
                      {
                        t: "We come to you.",
                        d: "When a card fits yours, you hear from us personally, and if it clicks we open the workspace for you both. No need to check back.",
                      },
                    ].map((step, i) => (
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
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6 max-w-2xl">
              <h2
                className="text-2xl lg:text-3xl font-black font-headline tracking-tight mb-2"
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                Who else is in
              </h2>
              <p className="text-sm" style={{ color: "#475569" }}>
                Experts and studios in the founding network, each with what they bring and who they
                would want next to them.
              </p>
            </div>
            {others.length === 0 ? (
              <div
                className="rounded-3xl p-6 lg:p-8 max-w-2xl"
                style={{
                  backgroundColor: "rgba(8,145,178,0.06)",
                  border: "1px solid rgba(8,145,178,0.18)",
                }}
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
