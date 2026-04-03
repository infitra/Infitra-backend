import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator" && profile?.role !== "admin") {
    redirect("/discover");
  }

  return (
    <div className="min-h-screen bg-[#071318]">
      {/* Top nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#071318]/80 backdrop-blur-xl border-b border-[#9CF0FF]/10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/dashboard">
            <div className="flex items-center gap-3">
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
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Sessions", href: "/dashboard/sessions" },
              { label: "Challenges", href: "/dashboard/challenges" },
              { label: "Earnings", href: "/dashboard/earnings" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-[#9CF0FF]/50 hover:text-[#9CF0FF] transition-colors font-headline"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9CF0FF]/50 font-headline hidden md:block">
              {profile?.display_name}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 rounded-full transition-all font-headline"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
