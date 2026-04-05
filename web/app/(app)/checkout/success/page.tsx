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
          <div className="w-20 h-20 rounded-full bg-green-400/10 border border-green-400/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-8">
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="#4ade80"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-3">
            You&apos;re in!
          </h1>
          <p className="text-sm text-[#9CF0FF]/50 leading-relaxed mb-8">
            Your payment has been confirmed. You&apos;ll receive a confirmation
            email shortly. The join link will be available when the session goes
            live.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/discover"
              className="w-full py-3.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)] text-center"
            >
              Back to Discover
            </Link>
            <Link
              href={homePath}
              className="w-full py-3.5 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 text-sm font-bold text-[#9CF0FF]/60 hover:text-[#9CF0FF] font-headline transition-colors text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
