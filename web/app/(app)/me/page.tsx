import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = { title: "My programs — INFITRA" };

/**
 * /me — participant home.
 *
 * Bundle 4.1 seed: a minimal "My programs" landing that lists every
 * challenge the viewer has purchased + a door into the cohort space.
 * It exists so participants — who otherwise have no home in INFITRA —
 * have somewhere meaningful to land after sign-in, and a place to come
 * back to once they're inside the ecosystem.
 *
 * Post-pilot, this is the natural shell for a richer participant
 * dashboard (analytics, achievements, active vs. upcoming programs,
 * past wins) — the symmetric counterpart to the creator dashboard.
 * For the pilot we ship just the doorway pattern; everything else can
 * grow inside this same surface without breaking links.
 */
export default async function MeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/me");

  // Viewer profile for nav chrome
  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Active + completed memberships, with the underlying challenge row
  // and the cohort space ID (for the doorway). One round-trip via a
  // nested PostgREST select — the joins respect RLS.
  const { data: memberships } = await supabase
    .from("app_challenge_member")
    .select(
      "challenge_id, joined_at, app_challenge(id, title, image_url, start_date, end_date, status, owner_id)",
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  type ChallengeRow = {
    id: string;
    title: string;
    image_url: string | null;
    start_date: string;
    end_date: string;
    status: string;
    owner_id: string;
  };
  type MembershipRow = {
    challenge_id: string;
    joined_at: string;
    app_challenge: ChallengeRow | null;
  };

  const rows = ((memberships ?? []) as unknown as MembershipRow[]).filter(
    (m): m is MembershipRow & { app_challenge: ChallengeRow } => !!m.app_challenge,
  );

  // Resolve space IDs in one query so we can render proper doorway links.
  // app_challenge_space.id !== source_challenge_id, so we need to map.
  const challengeIds = rows.map((r) => r.challenge_id);
  const { data: spaces } = challengeIds.length
    ? await supabase
        .from("app_challenge_space")
        .select("id, source_challenge_id")
        .in("source_challenge_id", challengeIds)
    : { data: [] };
  const spaceByChallenge = new Map<string, string>();
  for (const s of (spaces ?? []) as Array<{ id: string; source_challenge_id: string | null }>) {
    if (s.source_challenge_id) spaceByChallenge.set(s.source_challenge_id, s.id);
  }

  return (
    <>
      <ParticipantNav
        displayName={profile?.display_name ?? null}
        role={profile?.role ?? undefined}
      />

      <main className="pt-28 pb-16 px-6 lg:px-12 max-w-5xl mx-auto">
        <header className="mb-10 lg:mb-14">
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
            style={{ color: "#FF6130" }}
          >
            Your space
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight"
            style={{ color: "#0F2229" }}
          >
            My programs
          </h1>
          <p
            className="text-base lg:text-lg mt-4 max-w-xl leading-relaxed"
            style={{ color: "#475569" }}
          >
            Every challenge you&apos;ve joined. Open the cohort space to
            chat with your coaches and fellow participants.
          </p>
        </header>

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rows.map((r) => (
              <ProgramCard
                key={r.challenge_id}
                challenge={r.app_challenge}
                spaceId={spaceByChallenge.get(r.challenge_id) ?? null}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-3xl p-10 lg:p-14 text-center"
      style={{
        backgroundColor: "rgba(255,255,255,0.65)",
        border: "1px solid rgba(15,34,41,0.08)",
      }}
    >
      <p
        className="text-[10px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
        style={{ color: "#94a3b8" }}
      >
        Nothing yet
      </p>
      <h2
        className="text-2xl font-black font-headline tracking-tight mb-3"
        style={{ color: "#0F2229" }}
      >
        You haven&apos;t joined a program yet
      </h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: "#475569" }}>
        When you join a challenge, it&apos;ll show up here with a door
        into the cohort space.
      </p>
    </div>
  );
}

function ProgramCard({
  challenge,
  spaceId,
}: {
  challenge: {
    id: string;
    title: string;
    image_url: string | null;
    start_date: string;
    end_date: string;
    status: string;
  };
  spaceId: string | null;
}) {
  const dateRange = `${formatShortDate(challenge.start_date)} → ${formatShortDate(
    challenge.end_date,
  )}`;
  const today = new Date().toISOString().slice(0, 10);
  const isCompleted = challenge.status === "completed" || challenge.end_date < today;

  return (
    <li
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 4px 14px rgba(15,34,41,0.04)",
      }}
    >
      {/* Cover image */}
      <div
        className="relative aspect-[16/9]"
        style={{
          backgroundColor: "#0F2229",
          backgroundImage: challenge.image_url
            ? `url(${challenge.image_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold font-headline uppercase tracking-[0.18em]"
          style={{
            backgroundColor: isCompleted
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,97,48,0.95)",
            color: isCompleted ? "#475569" : "#FFFFFF",
          }}
        >
          {isCompleted ? "Completed" : "Active"}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3
          className="text-lg font-black font-headline tracking-tight mb-1.5"
          style={{ color: "#0F2229" }}
        >
          {challenge.title}
        </h3>
        <p className="text-xs mb-5" style={{ color: "#64748b" }}>
          {dateRange}
        </p>

        <div className="mt-auto flex items-center gap-3">
          <Link
            href={spaceId ? `/experiences/${challenge.id}/space` : `/experiences/${challenge.id}`}
            className="flex-1 text-center py-2.5 rounded-full text-white text-xs font-bold font-headline"
            style={{
              backgroundColor: "#0891b2",
              boxShadow: "0 4px 14px rgba(8,145,178,0.25)",
            }}
          >
            {spaceId ? "Open space →" : "Open page →"}
          </Link>
          <Link
            href={`/experiences/${challenge.id}`}
            className="text-xs font-bold font-headline px-3 py-2.5"
            style={{ color: "#64748b" }}
          >
            Details
          </Link>
        </div>
      </div>
    </li>
  );
}

function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
