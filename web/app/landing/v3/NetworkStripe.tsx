import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";

const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";

/**
 * The founding network on the landing (11 Sep 2026): a full-bleed dark
 * stripe, the same teal as the member's stage, so the cream cards with the
 * brand waves pop against it. Renders only with cards; the founding-network
 * section below shows the forming line until then. The homepage keeps the
 * shared FoundingRow; this one is /new's.
 *
 * `preview` is the admin's window while the public reader is closed: the
 * page passes the cards the caller is allowed to see, and this says so.
 */
export function NetworkStripe({ members, preview = false }: { members: FoundingMember[]; preview?: boolean }) {
  if (members.length === 0) return null;
  return (
    <section id="founding" className="relative px-6 py-20 md:py-24" style={{ backgroundColor: "#0C262E" }}>
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-10 md:mb-12">
          <p className="text-[11px] font-bold font-headline uppercase tracking-[0.25em]" style={{ color: CYAN_BRIGHT }}>
            The founding network
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-headline mt-3" style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.03em" }}>
            Experts and studios, <span style={{ color: CYAN_BRIGHT }}>open to creating together.</span>
          </h2>
          <p className="text-base md:text-lg mt-4 leading-relaxed" style={{ color: "rgba(242,239,232,0.72)" }}>
            Profiles appear here as their owners join. Each one says what they
            bring, and who they would want next to them.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {members.slice(0, 6).map((m) => (
            <FoundingCard key={m.id} m={m} compact />
          ))}
        </div>

        {preview && (
          <p className="mt-8 text-[11px] font-bold font-headline uppercase tracking-[0.2em]" style={{ color: "rgba(156,240,255,0.7)" }}>
            Preview: the network as you see it signed in. Visitors see this once the public reader opens.
          </p>
        )}
      </div>
    </section>
  );
}
