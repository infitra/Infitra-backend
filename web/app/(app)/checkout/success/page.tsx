import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Payment Confirmed — INFITRA",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}) {
  const { sid } = await searchParams;
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

  const homePath =
    profile?.role === "creator" || profile?.role === "admin"
      ? "/dashboard"
      : "/discover";

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          {/* Success icon */}
          <div
            className="w-20 h-20 rounded-full backdrop-blur-xl flex items-center justify-center mx-auto mb-8"
            style={{
              backgroundColor: "rgba(220, 252, 231, 0.85)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
            }}
          >
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="#047857"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1
            className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-3"
            style={{ color: "#0F2229" }}
          >
            You&apos;re in!
          </h1>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "#64748b" }}
          >
            Your payment has been confirmed. You&apos;ll receive a confirmation
            email shortly. The join link will be available when the session goes
            live.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/discover"
              className="w-full py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform text-center"
              style={{
                backgroundColor: "#FF6130",
                boxShadow:
                  "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
              }}
            >
              Back to Discover
            </Link>
            <Link
              href={homePath}
              className="w-full py-3.5 rounded-full text-sm font-bold font-headline transition-colors text-center"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.78)",
                border: "1px solid rgba(15, 34, 41, 0.15)",
                color: "#475569",
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
