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
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          {/* Cancel icon */}
          <div className="w-20 h-20 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 flex items-center justify-center mx-auto mb-8">
            <svg
              width="36"
              height="36"
              fill="none"
              stroke="#9CF0FF"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-3">
            Checkout cancelled
          </h1>
          <p className="text-sm text-[#9CF0FF]/50 leading-relaxed mb-8">
            No payment was made. You can always come back and purchase later.
          </p>

          <Link
            href="/discover"
            className="w-full inline-block py-3.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)] text-center"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    </div>
  );
}
