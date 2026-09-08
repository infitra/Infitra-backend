import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";

export const metadata = {
  title: "Network · INFITRA",
  robots: { index: false },
};

const INK = "#0F2229";
const CYAN = "#0891b2";

/**
 * /network/explore — everyone's cards (8 Sep 2026). The browsing surface of
 * the founding network, on the app's wave background; filters and full
 * profiles land here later without touching the personal stage at /network.
 * Reciprocity is enforced in the database: the directory needs the caller's
 * own card to be live (or admin). Below any other card it is the forming
 * state, never a count.
 */
export default async function NetworkExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/network/explore");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("role, display_name, community_visibility, workspace_enabled, is_admin")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");
  const isCreator = profile.role === "creator" || profile.role === "admin";
  if (!isCreator) redirect("/me");

  const { data: directory } = await supabase.rpc("load_founding_community", {
    p_public_only: false,
  });
  const authorized: boolean = directory?.authorized === true;
  const members: FoundingMember[] = (directory?.members ?? []) as FoundingMember[];
  const me = members.find((m) => m.id === user.id) ?? null;
  const others = members.filter((m) => m.id !== user.id);

  const label = (text: string, color = "#64748b") => (
    <p className="text-[11px] font-bold font-headline uppercase tracking-[0.25em]" style={{ color }}>
      {text}
    </p>
  );

  return (
    <div className="min-h-screen">
      <ParticipantNav
        displayName={profile.display_name}
        role={profile.role}
        workspaceEnabled={profile.workspace_enabled}
        isAdmin={profile.is_admin === true}
      />
      <div className="pt-20 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-baseline justify-between gap-4 flex-wrap">
            {label("Founding network")}
            <p className="text-sm" style={{ color: "#64748b" }}>
              Experts and studios, open to creating together.
            </p>
          </div>

          {!authorized ? (
            <div
              className="rounded-3xl p-6 lg:p-8 max-w-2xl"
              style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.18)" }}
            >
              <p className="text-lg font-black font-headline tracking-tight mb-2" style={{ color: INK }}>
                Your card opens the network.
              </p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#475569" }}>
                Everyone here shows their card, so the network sees yours first. A few minutes,
                then you are in.
              </p>
              <Link
                href="/network"
                className="inline-flex px-5 py-2.5 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
              >
                Make your card
              </Link>
            </div>
          ) : others.length === 0 ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
              <div
                className="rounded-3xl p-6 lg:p-8"
                style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.18)" }}
              >
                <p className="text-xl font-black font-headline tracking-tight mb-2" style={{ color: INK }}>
                  The founding network is forming.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                  We are bringing in experts and studios selectively, one by one. Their cards land
                  here as they come in, and we introduce you the moment one fits yours. Yours is
                  among the first.
                </p>
              </div>
              {me && (
                <div>
                  <div className="mb-3">{label("You", CYAN)}</div>
                  <FoundingCard m={me} />
                </div>
              )}
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
              {me && (
                <div className="flex flex-col gap-2 opacity-80">
                  <FoundingCard m={me} />
                  <span className="self-end text-[11px] font-bold font-headline uppercase tracking-[0.14em]" style={{ color: "#94a3b8" }}>
                    You
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
