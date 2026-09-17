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
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs" style={{ color: "#94a3b8" }}>
          {/* Named for what it is, not what it is filed as: next to Terms,
             Privacy and Legal Notice, "Pilot Terms" read as boilerplate and
             nobody opened the one page here written to be read. */}
          <Link href="/pilot-terms" className="hover:opacity-80">The deal, in plain language</Link>
          <Link href="/terms" className="hover:opacity-80">Terms</Link>
          <Link href="/privacy" className="hover:opacity-80">Privacy</Link>
          <Link href="/imprint" className="hover:opacity-80">Legal Notice</Link>
          <a href="mailto:hello@infitra.fit" className="hover:opacity-80">Contact</a>
          <span>© 2026 INFITRA</span>
        </div>
      </div>
    </footer>
  );
}
