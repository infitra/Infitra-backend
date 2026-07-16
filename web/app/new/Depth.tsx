import Link from "next/link";
import { INK, MUTED } from "./ui";

/**
 * M9 · Collapsible depth ("See why this matters") — ported from V1 with the
 * experiences vocabulary sweep — plus the footer. Believers converted at the
 * CTA above; skeptics get the full argument one click away.
 */

export function Depth() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <details className="group">
          <summary
            className="cursor-pointer list-none flex items-center justify-center gap-3 text-sm md:text-base font-headline transition-opacity hover:opacity-80"
            style={{ color: MUTED, fontWeight: 700 }}
          >
            <span>See why this matters</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform group-open:rotate-180" aria-hidden>
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>

          <div className="mt-10 space-y-6">
            {/* Two of everything */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: "rgba(255,255,255,0.55)", border: "1px solid rgba(15,34,41,0.08)" }}>
              <h3 className="text-xl md:text-2xl font-headline tracking-tight mb-6" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Even when collaborations happen — it&apos;s two of everything
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,97,48,0.05)", border: "1px solid rgba(255,97,48,0.18)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#FF6130", fontWeight: 700 }}>
                    Today
                  </p>
                  <ul className="space-y-1.5">
                    {["Two landing pages", "Two checkouts", "Fragmented experience"].map((item) => (
                      <li key={item} className="text-sm md:text-base font-headline" style={{ color: MUTED, fontWeight: 700 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.22)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#0891b2", fontWeight: 700 }}>
                    INFITRA
                  </p>
                  <ul className="space-y-1.5">
                    {["One experience", "One checkout", "One tribe"].map((item) => (
                      <li key={item} className="text-sm md:text-base font-headline" style={{ color: INK, fontWeight: 700 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Do everything themselves */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: "rgba(255,255,255,0.55)", border: "1px solid rgba(15,34,41,0.08)" }}>
              <h3 className="text-xl md:text-2xl font-headline tracking-tight mb-5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Creators try to do everything themselves
              </h3>
              <div className="space-y-3 text-base leading-relaxed" style={{ color: MUTED }}>
                <p>
                  A trainer adds meal plans. A nutrition coach adds workouts. Everyone tries to sell
                  a &ldquo;complete&rdquo; offer.
                </p>
                <p>But this spreads focus.</p>
                <p>
                  Instead of delivering their strongest expertise, they dilute it across areas they
                  don&apos;t fully own.
                </p>
                <div className="mt-5 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,97,48,0.08)", border: "1px solid rgba(255,97,48,0.25)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-headline mb-1" style={{ color: "#FF6130", fontWeight: 700 }}>
                    The result
                  </p>
                  <p className="text-base font-headline" style={{ color: INK, fontWeight: 700 }}>
                    Offers that try to do everything — and don&apos;t stand out in anything.
                  </p>
                </div>
              </div>
            </div>

            {/* Collaboration not real */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: "rgba(255,255,255,0.55)", border: "1px solid rgba(15,34,41,0.08)" }}>
              <h3 className="text-xl md:text-2xl font-headline tracking-tight mb-5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Collaboration already happens — but it&apos;s not real
              </h3>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: MUTED }}>
                <p>Creators go live together. They mention each other. They create videos together.</p>
                <p style={{ color: INK, fontWeight: 700 }}>But:</p>
                <ul className="space-y-1.5 pl-1">
                  {["it's mostly for marketing and publicity", "monetization is unclear or minimal", "there is no professional setup"].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full bg-[#0F2229]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="pt-2" style={{ color: INK, fontWeight: 700 }}>Behind the scenes:</p>
                <ul className="space-y-1.5 pl-1">
                  {["WhatsApp coordination", "vague agreements", "one person collects revenue", "payouts happen on trust"].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full bg-[#0F2229]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-base font-headline pt-2" style={{ color: INK, fontWeight: 700 }}>
                  → It never becomes a real product. INFITRA makes it one.
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(15,34,41,0.08)", backgroundColor: "rgba(242,239,232,0.6)" }}>
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="INFITRA" width={28} height={28} className="block rounded-md" />
          <span className="text-base tracking-tight font-headline" style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}>
            INFITRA
          </span>
        </div>
        <div className="flex gap-6 text-xs" style={{ color: "#94a3b8" }}>
          <Link href="/pilot-terms" className="hover:opacity-80">Pilot Terms</Link>
          <a href="mailto:hello@infitra.fit" className="hover:opacity-80">Contact</a>
          <span>© 2026 INFITRA</span>
        </div>
      </div>
    </footer>
  );
}
