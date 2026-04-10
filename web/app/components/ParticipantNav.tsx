import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";
import { MobileMenu } from "@/app/components/MobileMenu";

export function ParticipantNav({
  displayName,
}: {
  displayName: string | null;
}) {
  return (
    <nav className="fixed top-0 w-full z-50">
      {/* Gradient fade: slightly opaque at top → transparent at bottom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(242, 239, 232, 0.92)",
          borderBottom: "1px solid rgba(15, 34, 41, 0.08)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/discover" className="flex items-center gap-2.5">
          <img
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
          <MobileMenu
            links={[
              { label: "Home", href: "/discover" },
              { label: "Discover", href: "/discover#discover" },
            ]}
          />
          <Link
            href="/discover"
            className="font-headline text-xs font-bold uppercase tracking-widest transition-colors hidden md:block hover:opacity-80"
            style={{ color: "rgba(15, 34, 41, 0.50)" }}
          >
            Home
          </Link>
          <Link
            href="/discover#discover"
            className="font-headline text-xs font-bold uppercase tracking-widest transition-colors hidden md:block hover:opacity-80"
            style={{ color: "rgba(15, 34, 41, 0.50)" }}
          >
            Discover
          </Link>
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
