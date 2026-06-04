import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Payment Confirmed — INFITRA",
};

/**
 * Post-purchase confirmation. Reached right after Stripe redirects on a
 * successful payment (success_url) — including the buy-intent flow where a
 * brand-new account signs up and goes straight to checkout.
 *
 * The job here is to get the buyer INTO the thing they just bought, not to
 * dump them on the marketing landing page. Two realities shape the logic:
 *
 *  1. We need to know which Experience they bought. Stripe gives us back only
 *     the Checkout Session id (`sid`). The clean signal is `xid` (the challenge
 *     id) threaded onto success_url by create_checkout_session; if that's
 *     present we trust it. As a fallback (older links / belt-and-braces) we
 *     read the buyer's most-recent membership.
 *
 *  2. Entitlement is created ASYNC by the stripe_webhook (app_challenge_member
 *     + app_transaction). Stripe redirects here immediately, so the membership
 *     may not exist for a second or two. We therefore only deep-link into the
 *     Experience Space once we can CONFIRM the membership row — otherwise the
 *     space's access gate would bounce them back to the buyer page ("buy
 *     again"). When it's not yet confirmed we send them to My Programs, where
 *     the program surfaces the moment the webhook lands.
 *
 * (The forthcoming post-purchase profile step will sit between this page and
 * the Experience and naturally absorb that webhook gap.)
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string; xid?: string; kind?: string }>;
}) {
  const { xid, kind } = await searchParams;
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

  // Resolve the purchased Experience + confirm entitlement.
  let challengeId: string | null = null;
  let entitled = false;

  if (xid && kind !== "session") {
    // Explicit target from success_url — verify the membership for THIS one.
    const { data: m } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .eq("user_id", user.id)
      .eq("challenge_id", xid)
      .maybeSingle();
    challengeId = xid;
    entitled = !!m;
  } else if (!xid) {
    // Fallback: the buyer's most-recent enrollment.
    const { data: m } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (m) {
      challengeId = m.challenge_id as string;
      entitled = true;
    }
  }

  const canOpenExperience = entitled && !!challengeId;

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} role={profile?.role} />

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
            {canOpenExperience ? (
              <>
                Your payment&apos;s confirmed and a receipt is on its way.
                Everything for this program — your tribe, the weekly plan, and
                the live join button when sessions start — lives in your
                Experience Space.
              </>
            ) : (
              <>
                Your payment&apos;s confirmed and a receipt is on its way.
                We&apos;re just finalizing your enrollment — your program will
                appear in My Programs in a few seconds.
              </>
            )}
          </p>

          <div className="flex flex-col gap-3">
            {canOpenExperience ? (
              <>
                <Link
                  href={`/experiences/${challengeId}/space`}
                  className="w-full py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform text-center"
                  style={{
                    backgroundColor: "#FF6130",
                    boxShadow:
                      "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
                  }}
                >
                  Open your Experience
                </Link>
                <Link
                  href="/me"
                  className="w-full py-3.5 rounded-full text-sm font-bold font-headline transition-colors text-center"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.78)",
                    border: "1px solid rgba(15, 34, 41, 0.15)",
                    color: "#475569",
                  }}
                >
                  My Programs
                </Link>
              </>
            ) : (
              <Link
                href="/me"
                className="w-full py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform text-center"
                style={{
                  backgroundColor: "#FF6130",
                  boxShadow:
                    "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
                }}
              >
                Go to My Programs
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
