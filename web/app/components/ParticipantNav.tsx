import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";
import { MobileMenu } from "@/app/components/MobileMenu";
import { NotificationBell } from "@/app/components/NotificationBell";

/**
 * The single app nav for every authenticated surface — creators AND
 * participants. (It only ever renders for a logged-in user: the public buyer
 * page shows its own anon header instead, and every other host redirects anon
 * to /login.) Role drives the contents:
 *
 *   - Participant: minimal — just "Home" (→ /me, the same place the logo goes)
 *     plus the notification bell. Participants get real notifications too
 *     (coach answered your question, intro prompt, etc.), so the bell belongs.
 *   - Creator: Home / Earnings + a Create pill + the bell.
 *
 * Solid-cream treatment (no backdrop-blur): a fixed bar blurring the animated
 * background re-rasterises every frame and is a known mobile scroll-jank
 * source — the same reason the dashboard's old blur nav was retired here.
 */
export function ParticipantNav({
  displayName,
  role,
}: {
  displayName: string | null;
  role?: string;
}) {
  const isCreator = role === "creator" || role === "admin";
  const homeHref = isCreator ? "/dashboard" : "/me";

  // Desktop links (the Create pill is rendered separately for creators).
  const links = isCreator
    ? [
        { label: "Home", href: "/dashboard" },
        { label: "Earnings", href: "/dashboard/earnings" },
      ]
    : [{ label: "Home", href: "/me" }];

  // Mobile menu mirrors desktop, folding Create back in for creators.
  const mobileLinks = isCreator
    ? [
        { label: "Home", href: "/dashboard" },
        { label: "Create", href: "/dashboard/create" },
        { label: "Earnings", href: "/dashboard/earnings" },
      ]
    : [{ label: "Home", href: "/me" }];

  return (
    <nav className="fixed top-0 w-full z-50">
      <div
        style={{
          position: "absolute",
          inset: 0,
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
          <MobileMenu links={mobileLinks} />

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

          {isCreator && (
            <Link
              href="/dashboard/create"
              className="hidden md:inline-flex px-4 py-2 rounded-full text-xs font-black font-headline text-white uppercase tracking-widest"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
            >
              + Create
            </Link>
          )}

          <NotificationBell />

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
