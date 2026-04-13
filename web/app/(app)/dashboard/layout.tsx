import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";
import { MobileMenu } from "@/app/components/MobileMenu";

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
    <div className="min-h-screen">
      {/* Top nav — fluid, lets wave background bleed through */}
      <nav className="fixed top-0 w-full z-50">
        {/* Gradient fade: slightly opaque at top → transparent at bottom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(242, 239, 232, 0.80)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.40)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
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

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Home", href: "/dashboard" },
              { label: "Create", href: "/dashboard/create" },
              { label: "Tribes", href: "/dashboard/tribes" },
              { label: "Earnings", href: "/dashboard/earnings" },
            ].map(({ label, href }) => (
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

          <div className="flex items-center gap-4">
            <MobileMenu
              links={[
                { label: "Home", href: "/dashboard" },
                { label: "Create", href: "/dashboard/create" },
                { label: "Tribes", href: "/dashboard/tribes" },
                { label: "Earnings", href: "/dashboard/earnings" },
              ]}
            />
            <span
              className="text-sm font-headline font-semibold hidden md:block"
              style={{ color: "rgba(15, 34, 41, 0.50)" }}
            >
              {profile?.display_name}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-full transition-all font-headline hover:opacity-80"
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

      {/* Content */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
