import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";
import { MobileMenu } from "@/app/components/MobileMenu";

export function ParticipantNav({
  displayName,
  role,
}: {
  displayName: string | null;
  role?: string;
}) {
  const isCreator = role === "creator" || role === "admin";
  // Bundle 4.1: participants now have a home at /me — "My programs"
  // lists their purchases with a door into each cohort space. Creators
  // still go to /dashboard. This makes the logo (and post-login landing)
  // actually meaningful for participants instead of dropping them on the
  // marketing landing page.
  const homeHref = isCreator ? "/dashboard" : "/me";

  // Creator links mirror the dashboard layout nav.
  // Participant links are intentionally minimal for the pilot — just the
  // "My programs" doorway. Post-pilot this is where Discover, Achievements,
  // etc. will live.
  const links = isCreator
    ? [
        { label: "Home", href: "/dashboard" },
        { label: "Create", href: "/dashboard/create" },
        { label: "Earnings", href: "/dashboard/earnings" },
      ]
    : [{ label: "My programs", href: "/me" }];

  return (
    <nav className="fixed top-0 w-full z-50">
      <div
        style={{
          position: "absolute",
          inset: 0,
          // Near-opaque solid instead of backdrop-filter blur. A fixed bar
          // blurring the *animated* background re-rasterises every frame
          // (even idle) and is a major mobile scroll-jank source. Solid cream
          // looks near-identical over the cream page and is compositor-free.
          background: "rgba(244, 241, 234, 0.94)",
          borderBottom: "1px solid rgba(15, 34, 41, 0.06)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <Image
            src="/logo-mark.png"
            alt="INFITRA"
            width={34}
            height={34}
            className="block rounded-lg"
          />
          <span
            className="text-[22px] tracking-tight font-headline leading-none"
            style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            INFITRA
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <MobileMenu links={links} />
          <div className="hidden md:flex items-center gap-8">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="font-headline text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80"
                style={{ color: "rgba(15, 34, 41, 0.50)" }}
              >
                {label}
              </Link>
            ))}
          </div>
          {displayName && (
            <span
              className="text-sm font-headline font-semibold hidden md:block"
              style={{ color: "rgba(15, 34, 41, 0.50)" }}
            >
              {displayName}
            </span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-full transition-all font-headline cursor-pointer hover:opacity-80"
              style={{
                color: "rgba(15, 34, 41, 0.50)",
                border: "1px solid rgba(15, 34, 41, 0.12)",
                backgroundColor: "rgba(255, 255, 255, 0.35)",
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
