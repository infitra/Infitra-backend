import Link from "next/link";

/**
 * LegalFooter — the one legal-links row, mounted on every surface group
 * (landing footer, auth shell, the whole logged-in app incl. the buyer
 * page). The impressum must be reachable one click from every page (UWG
 * Art. 3(1)(s)); riding the layouts is what makes that true without
 * per-page work.
 */
export function LegalFooter({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] ${className ?? ""}`}
      style={{ color: "#94a3b8" }}
    >
      <Link href="/imprint" className="hover:opacity-80">Legal Notice</Link>
      <Link href="/privacy" className="hover:opacity-80">Privacy</Link>
      <Link href="/terms" className="hover:opacity-80">Terms</Link>
      <Link href="/refund-policy" className="hover:opacity-80">Refunds</Link>
      <span>© 2026 INFITRA</span>
    </div>
  );
}
