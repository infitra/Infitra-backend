import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";

export function ParticipantNav({
  displayName,
}: {
  displayName: string | null;
}) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#071318]/80 backdrop-blur-xl border-b border-[#9CF0FF]/10">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/discover" className="flex items-center gap-3">
          <div className="rounded-xl overflow-hidden">
            <Image
              src="/logo-mark.png"
              alt="INFITRA"
              width={36}
              height={36}
              className="block"
            />
          </div>
          <span className="text-lg font-black text-[#FF6130] tracking-tighter font-headline italic">
            INFITRA
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/discover#my-sessions"
            className="text-xs font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] font-headline transition-colors hidden md:block"
          >
            My Sessions
          </Link>
          <Link
            href="/communities"
            className="text-xs font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] font-headline transition-colors hidden md:block"
          >
            Communities
          </Link>
          <Link
            href="/discover"
            className="text-xs font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] font-headline transition-colors hidden md:block"
          >
            Discover
          </Link>
          {displayName && (
            <span className="text-sm text-[#9CF0FF]/50 font-headline hidden md:block">
              {displayName}
            </span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 rounded-full transition-all font-headline cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
