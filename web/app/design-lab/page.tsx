import Link from "next/link";

export const metadata = {
  title: "Design Lab — INFITRA",
};

// ── Design Lab ────────────────────────────────────────────────────
// A persistent gallery of design directions we've explored. Each entry
// links to a self-contained preview page that uses sample data so we
// can compare directions without auth.
//
// Gating: this route lives outside `(app)`, so the auth proxy doesn't
// require a Supabase user. The beta-access cookie still gates it, so
// the public can never reach it.

type Entry = {
  href: string;
  title: string;
  subtitle: string;
  status: "live" | "archived" | "experimental";
  notes: string;
};

const ENTRIES: Entry[] = [
  {
    href: "/design-lab/beam-vocabulary",
    title: "Beam vocabulary",
    subtitle: "Bottom-edge cyan beam · resting / hover / featured cards",
    status: "live",
    notes:
      "Single sharp cyan beam at the bottom of the viewport. Cards use the same beam vocabulary: dark glass at rest, inset cyan beam on hover, permanent beam + halo for system-featured items. Currently applied to /dashboard/sessions and /dashboard/challenges.",
  },
  {
    href: "/design-lab/wave-background",
    title: "Wave background",
    subtitle: "Three drifting SVG waves + 30 floating star particles",
    status: "archived",
    notes:
      "Original DepthBackground before the bottom-beam direction was chosen. Three layered waves drift left/right at the bottom of the viewport with deterministic star particles scattered above. Kept for comparison.",
  },
];

const STATUS_STYLES: Record<Entry["status"], string> = {
  live: "text-[#9CF0FF] bg-[#9CF0FF]/10 border-[#9CF0FF]/30",
  archived: "text-white/40 bg-white/5 border-white/15",
  experimental: "text-[#FF6130] bg-[#FF6130]/10 border-[#FF6130]/30",
};

export default function DesignLabIndexPage() {
  return (
    <div className="min-h-screen bg-[#071318] text-white">
      <div className="max-w-5xl mx-auto px-10 py-16">
        <header className="mb-12">
          <div className="font-headline text-[10px] uppercase tracking-[0.25em] text-white/35 mb-3">
            Internal · Design Lab
          </div>
          <h1 className="font-headline text-5xl font-black leading-[0.95]">
            Design directions
          </h1>
          <p className="font-body text-white/55 mt-4 max-w-xl">
            A persistent gallery of design directions we&apos;ve explored.
            Each entry is a self-contained preview that survives in the
            codebase so we can compare and decide later.
          </p>
        </header>

        <div className="space-y-4">
          {ENTRIES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="block p-6 rounded-xl bg-[rgba(15,34,41,0.55)] backdrop-blur-xl border border-[rgba(156,240,255,0.10)] hover:bg-[rgba(15,34,41,0.85)] hover:border-[rgba(156,240,255,0.28)] transition-colors group"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-headline text-2xl font-black tracking-tight text-white">
                      {entry.title}
                    </h2>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${STATUS_STYLES[entry.status]}`}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <p className="font-body text-sm text-[#9CF0FF]/60 mb-3">
                    {entry.subtitle}
                  </p>
                  <p className="font-body text-sm text-white/55 leading-relaxed">
                    {entry.notes}
                  </p>
                </div>
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  className="text-[#9CF0FF]/30 group-hover:text-[#9CF0FF]/70 transition-colors shrink-0 mt-2"
                >
                  <path
                    d="M9 18l6-6-6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-white/5">
          <p className="font-body text-xs text-white/30">
            New direction? Add a folder under{" "}
            <code className="text-[#9CF0FF]/50">web/app/design-lab/</code> with
            its own <code className="text-[#9CF0FF]/50">page.tsx</code>, then
            add an entry to <code className="text-[#9CF0FF]/50">ENTRIES</code>{" "}
            in this file.
          </p>
        </footer>
      </div>
    </div>
  );
}
