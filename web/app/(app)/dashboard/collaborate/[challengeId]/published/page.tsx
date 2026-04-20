import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Collaboration Published — INFITRA" };

/**
 * Post-publish celebration page. The owner lands here right after hitting
 * Publish; cohosts can also navigate here to see the same summary. Purely
 * celebratory: no edit affordances, no deep links into session overviews,
 * one clear CTA back to the dashboard. Avoids the "nested" feeling the
 * generic challenge preview page had right after publish.
 */
export default async function PublishedCelebrationPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("id, title, description, start_date, end_date, price_cents, currency, status, owner_id, image_url")
    .eq("id", challengeId)
    .single();

  if (!challenge) redirect("/dashboard");

  // Viewer must be a party to the collaboration.
  const isOwner = challenge.owner_id === user.id;
  const { data: cohostRow } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id")
    .eq("challenge_id", challengeId)
    .eq("cohost_id", user.id)
    .maybeSingle();
  if (!isOwner && !cohostRow) redirect("/dashboard");

  // If somehow we land here before the publish actually completed, bounce
  // back to the workspace — otherwise the celebration would be a lie.
  if (challenge.status !== "published") {
    redirect(`/dashboard/collaborate/${challengeId}`);
  }

  // Parties (for the "signed by" row)
  const { data: cohostRows } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id, split_percent")
    .eq("challenge_id", challengeId);
  const cohosts = cohostRows ?? [];
  const partyIds = [challenge.owner_id, ...cohosts.map((c: any) => c.cohost_id)];
  const { data: profiles } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url")
    .in("id", partyIds);
  const profileMap: Record<string, { name: string; avatar: string | null }> = {};
  for (const p of profiles ?? []) profileMap[p.id] = { name: p.display_name ?? "Creator", avatar: p.avatar_url };

  // Session count (display only; no links out)
  const { data: sessionLinks } = await supabase
    .from("app_challenge_session")
    .select("session_id")
    .eq("challenge_id", challengeId);
  const sessionCount = sessionLinks?.length ?? 0;

  const priceCHF = (challenge.price_cents ?? 0) / 100;
  const startDate = new Date(challenge.start_date + "T00:00:00");
  const endDate = new Date(challenge.end_date + "T00:00:00");

  return (
    <div className="py-16 max-w-2xl mx-auto px-4">
      {/* Celebration hero */}
      <div className="text-center mb-10">
        {/* Live-dot animation — calm, not confetti-loud */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
             style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black font-headline uppercase tracking-wider" style={{ color: "#047857" }}>
            Now Live
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black font-headline text-[#0F2229] tracking-tight leading-tight mb-3">
          Your collaboration is<br />out in the world.
        </h1>
        <p className="text-base text-[#64748b] max-w-lg mx-auto">
          Everyone&apos;s signed, and <span className="font-bold text-[#0F2229]">{challenge.title}</span> is now visible to participants.
        </p>
      </div>

      {/* Challenge summary card — mirrors the tone of the locked envelope
          but in the "done!" color family. */}
      <div className="rounded-3xl overflow-hidden mb-8" style={{
        backgroundColor: "#A8D5DC",
        border: "1px solid rgba(8,145,178,0.3)",
      }}>
        {challenge.image_url && (
          <div className="aspect-[3/1] w-full overflow-hidden">
            <img src={challenge.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 bg-white">
          <h2 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight mb-4">
            {challenge.title}
          </h2>

          {/* Key facts — no session links, just the shape of the collab */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
              <p className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1" style={{ color: "rgba(15,34,41,0.45)" }}>Runs</p>
              <p className="text-sm font-bold font-headline text-[#0F2229]" suppressHydrationWarning>
                {startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {" → "}
                {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
              <p className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1" style={{ color: "rgba(15,34,41,0.45)" }}>Sessions</p>
              <p className="text-sm font-bold font-headline text-[#0F2229]">{sessionCount}</p>
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
              <p className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1" style={{ color: "rgba(15,34,41,0.45)" }}>Price</p>
              <p className="text-sm font-bold font-headline text-[#0F2229]">
                {priceCHF > 0 ? `${challenge.currency} ${priceCHF.toFixed(2)}` : "Free"}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
              <p className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1" style={{ color: "rgba(15,34,41,0.45)" }}>Collaborators</p>
              <p className="text-sm font-bold font-headline text-[#0F2229]">{cohosts.length + 1}</p>
            </div>
          </div>

          {/* Signed by row */}
          <div>
            <p className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider mb-2">Signed by</p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Owner */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(255,97,48,0.08)" }}>
                {profileMap[challenge.owner_id]?.avatar ? (
                  <img src={profileMap[challenge.owner_id]!.avatar!} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-[9px] font-black text-orange-700">{profileMap[challenge.owner_id]?.name[0] ?? "?"}</span>
                  </div>
                )}
                <span className="text-xs font-bold text-[#0F2229]">{profileMap[challenge.owner_id]?.name}</span>
              </div>
              {cohosts.map((c: any) => (
                <div key={c.cohost_id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(8,145,178,0.08)" }}>
                  {profileMap[c.cohost_id]?.avatar ? (
                    <img src={profileMap[c.cohost_id]!.avatar!} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                      <span className="text-[9px] font-black text-cyan-700">{profileMap[c.cohost_id]?.name[0] ?? "?"}</span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-[#0F2229]">{profileMap[c.cohost_id]?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA — exactly one, unambiguous, back to dashboard. */}
      <div className="flex justify-center">
        <Link
          href="/dashboard"
          className="inline-block px-8 py-3.5 rounded-full text-white text-base font-black font-headline"
          style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
