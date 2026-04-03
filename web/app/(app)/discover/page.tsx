import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      {/* Minimal nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#071318]/80 backdrop-blur-xl border-b border-[#9CF0FF]/10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden">
              <Image src="/logo-mark.png" alt="INFITRA" width={36} height={36} className="block" />
            </div>
            <span className="text-lg font-black text-[#FF6130] tracking-tighter font-headline italic">
              INFITRA
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9CF0FF]/50 font-headline hidden md:block">
              {profile?.display_name}
            </span>
            <Link
              href="/signout"
              className="px-4 py-2 text-xs font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 rounded-full transition-all font-headline"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#9CF0FF]/4 blur-[150px]" />
        </div>
        <div className="relative z-10 text-center">
          <p className="text-xs text-[#9CF0FF]/30 uppercase tracking-widest font-bold mb-4 font-headline">
            Coming Soon
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white font-headline tracking-tight mb-4">
            Discover
          </h1>
          <p className="text-sm text-[#9CF0FF]/40 max-w-sm">
            Browse live sessions, challenges, and creators. This is where you
            train.
          </p>
        </div>
      </div>
    </div>
  );
}
