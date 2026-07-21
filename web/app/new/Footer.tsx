import Link from "next/link";

/** M9 · Footer — the only thing after the finale. */
export function Footer() {
  return (
    // fully transparent — the wave background flows through
    <footer style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }}>
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
