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

/**
 * /network — the founding network's home, two states (8 Sep 2026).
 *
 * No card yet: one form, one button, and the card is live. Card exists: the
 * rendered card as the network sees it, what happens next, and everyone
 * else who is in. The directory reads through load_founding_community(false),
 * which requires the caller's own card to be live (reciprocity) or admin;
 * in the second state that is always true.
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
    .select(
      "role, display_name, tagline, bio, avatar_url, profile_facts, entity_type, open_to, brings, seeks, announce_ok, community_visibility, workspace_enabled, is_admin",
    )
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
          <div className="max-w-3xl mx-auto">
            <header className="mb-10">
              {eyebrow}
              <h1
                className="text-3xl lg:text-4xl font-black font-headline tracking-tight mb-3"
                style={{ color: INK }}
              >
                Your card in the founding network.
              </h1>
              <p className="text-base max-w-2xl" style={{ color: "#475569" }}>
                Experts and studios, open to creating live experiences together. Your card is how
                the network sees you and how we find you the right fit: who you are, what you
                bring, what would complement you. A few minutes, then you are in.
              </p>
            </header>

            <JoinNetworkForm
              mode="join"
              initial={{
                displayName: profile.display_name,
                tagline: profile.tagline ?? "",
                bio: profile.bio ?? "",
                avatarUrl: profile.avatar_url ?? null,
                city: facts.city ?? "",
                entityType: (profile.entity_type ?? null) as "expert" | "studio" | null,
                openTo: (profile.open_to ?? []) as string[],
                brings: profile.brings ?? "",
                seeks: profile.seeks ?? "",
                announceOk: profile.announce_ok !== false,
              }}
            />

            {others.length > 0 && (
              <section className="mt-16">
                <h2 className="text-xl font-black font-headline tracking-tight mb-5" style={{ color: INK }}>
                  Already in
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
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
      <div className="pt-24 px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            {eyebrow}
            <h1
              className="text-3xl lg:text-4xl font-black font-headline tracking-tight mb-3"
              style={{ color: INK }}
            >
              {justJoined ? "You're in." : "Your card."}
            </h1>
            <p className="text-base max-w-2xl" style={{ color: "#475569" }}>
              {justJoined
                ? "Your card is live on infitra.fit and in the network. We read every new card ourselves and reach out the moment we see a fit."
                : "Live on infitra.fit and in the network. Keep it current: it is what we match on."}
            </p>
          </header>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start mb-16">
            <div>
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <p
                  className="text-[11px] font-bold font-headline uppercase tracking-[0.2em]"
                  style={{ color: "#64748b" }}
                >
                  Your card, as the network sees it
                </p>
                <Link
                  href="/network/edit"
                  className="text-[11px] font-bold font-headline uppercase tracking-[0.14em] whitespace-nowrap"
                  style={{ color: CYAN }}
                >
                  Edit your card →
                </Link>
              </div>
              <FoundingCard m={me} />
            </div>

            <div
              className="rounded-3xl p-6 lg:p-7"
              style={{
                backgroundColor: "rgba(255,97,48,0.06)",
                border: "1px solid rgba(255,97,48,0.18)",
              }}
            >
              <p
                className="text-[11px] font-bold font-headline uppercase tracking-[0.2em] mb-3"
                style={{ color: "#c2410c" }}
              >
                What happens next
              </p>
              <p className="text-sm leading-relaxed mb-3" style={{ color: INK }}>
                While INFITRA is invite-only, we do the matching by hand. We read every card, we
                introduce you when one fits yours, and if it clicks we open the workspace for you
                both: outline, page, live rooms and the revenue split, set up together.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: INK }}>
                The first experiences on INFITRA come out of exactly these introductions. Founding
                cards keep the top spot in discovery when INFITRA opens publicly.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black font-headline tracking-tight mb-5" style={{ color: INK }}>
              Who else is in
            </h2>
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
              <div className="grid gap-4 md:grid-cols-2">
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
