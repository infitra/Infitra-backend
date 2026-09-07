import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { createAnonClient } from "@/lib/supabase/anon";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";

/**
 * /founding-network — the public list of the founding network (6 Sep 2026).
 * Standalone marketing surface like /apply (no beta gate, in the sitemap).
 * Reads load_founding_community(true): explicit public-safe columns, and an
 * empty list until three public cards exist, enforced in the database so an
 * anonymous caller can never enumerate below the threshold.
 */

export const metadata = {
  title: "The founding network · INFITRA",
  description:
    "Experts and studios open to creating live experiences together. Each card is one sentence: what they would love to run, and who they would want next to them.",
};

export const revalidate = 300;

export default async function FoundingGroupPage() {
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("load_founding_community", { p_public_only: true });
  const members: FoundingMember[] = (data?.members ?? []) as FoundingMember[];
  const forming = members.length < 3;

  return (
    <div className="min-h-screen relative overflow-x-clip" style={{ backgroundColor: "#F2EFE8" }}>
      <WaveFlowingBackground />
      <div className="relative z-10">
        <div className="px-6 pt-6 pb-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="INFITRA" width={28} height={28} className="block rounded-lg" />
              <span
                className="text-lg tracking-tight font-headline leading-none"
                style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                INFITRA
              </span>
            </Link>
            <Link
              href="/apply"
              className="px-4 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest whitespace-nowrap"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
            >
              Be in the picture
            </Link>
          </div>
        </div>

        <main className="px-6 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <header className="max-w-3xl mb-10">
              <p
                className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
                style={{ color: "#0891b2" }}
              >
                The founding network
              </p>
              <h1
                className="text-4xl md:text-5xl font-headline tracking-tight leading-[1.08] mb-4"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Experts and studios, open to creating together.
              </h1>
              <p className="text-base md:text-lg" style={{ color: "#475569" }}>
                Live experiences on INFITRA run online over several weeks: participants buy once,
                meet the experts live on video, and stay connected in a group space in between.
                Each card here is one sentence: what its owner would love to run, and who they
                would want next to them.
              </p>
            </header>

            {forming ? (
              <div
                className="rounded-3xl p-8 max-w-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.62)", border: "1px solid rgba(15,34,41,0.08)" }}
              >
                <p className="text-lg font-headline font-bold mb-2" style={{ color: "#0F2229" }}>
                  The founding network is forming.
                </p>
                <p className="text-sm" style={{ color: "#475569" }}>
                  Cards go public here as their owners choose to be seen. If you would want to be
                  in the picture, the door is open.
                </p>
                <Link
                  href="/apply"
                  className="inline-flex mt-5 px-5 py-2.5 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest"
                  style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
                >
                  Be in the picture
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <FoundingCard key={m.id} m={m} />
                ))}
              </div>
            )}

            <p className="text-xs mt-12" style={{ color: "#94a3b8" }}>
              Every card is shown with its owner&apos;s consent and can be withdrawn with one message.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
