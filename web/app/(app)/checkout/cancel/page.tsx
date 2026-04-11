import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Checkout Cancelled — INFITRA",
};

export default async function CheckoutCancelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} role={profile?.role} />

      <div className="flex-1 pt-20 px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          {/* Cancel icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.78)",
              border: "1px solid rgba(15, 34, 41, 0.15)",
            }}
          >
            <svg
              width="36"
              height="36"
              fill="none"
              stroke="#94a3b8"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>

          <h1
            className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-3"
            style={{ color: "#0F2229" }}
          >
            Checkout cancelled
          </h1>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "#64748b" }}
          >
            No payment was made. You can always come back and purchase later.
          </p>

          <Link
            href="/discover"
            className="w-full inline-block py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform text-center"
            style={{
              backgroundColor: "#FF6130",
              boxShadow:
                "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
            }}
          >
            Back to Discover
          </Link>
        </div>
      </div>
    </div>
  );
}
