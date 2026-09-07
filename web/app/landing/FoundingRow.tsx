import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { INK, ORANGE, MUTED } from "./ui";

/**
 * The founding network on the homepage (6 Sep 2026).
 *
 * Real cards, real names, only with public consent, and only once three
 * public cards exist: load_founding_community(true) returns [] below that,
 * so this section renders nothing until the row is a row. Shows up to six;
 * /founding-network is the full list. Server component, anonymous read.
 */
export async function FoundingRow() {
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("load_founding_community", { p_public_only: true });
  const members: FoundingMember[] = ((data?.members ?? []) as FoundingMember[]).slice(0, 6);
  if (members.length < 3) return null;
  const total: number = Number(data?.count ?? members.length);

  return (
    <section id="founding" className="px-6 pt-20 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
            style={{ color: ORANGE }}
          >
            The founding network
          </p>
          <h2
            className="text-3xl md:text-5xl font-headline tracking-tight leading-[1.08] mb-4"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            Experts and studios, <span style={{ color: ORANGE }}>open to creating together.</span>
          </h2>
          <p className="text-base md:text-lg" style={{ color: MUTED }}>
            Each card is one sentence: what they would love to run, and who they would want next
            to them.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <FoundingCard key={m.id} m={m} compact />
          ))}
        </div>

        <div className="text-center mt-10">
          <p
            className="text-lg md:text-xl font-headline tracking-tight mb-4"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            What would you build, and who would you build it with?
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {total > members.length && (
              <Link
                href="/founding-network"
                className="px-5 py-2.5 rounded-full text-xs font-headline font-bold uppercase tracking-widest"
                style={{ color: INK, border: "1px solid rgba(15,34,41,0.18)", backgroundColor: "rgba(255,255,255,0.5)" }}
              >
                All founding cards
              </Link>
            )}
            <Link
              href="/apply"
              className="px-5 py-2.5 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest"
              style={{ backgroundColor: ORANGE, boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
            >
              Be in the picture
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
