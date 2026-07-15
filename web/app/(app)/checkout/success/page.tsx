import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { FirstMovesCard } from "./FirstMovesCard";

export const metadata = {
  title: "Payment Confirmed — INFITRA",
};

const DEFAULT_INTRO_PROMPT = "What are you hoping to get from this Experience?";

/**
 * Post-purchase confirmation + onboarding. Reached right after Stripe redirects
 * on a successful payment (success_url) — including the buy-intent flow where a
 * brand-new account signs up and goes straight to checkout.
 *
 * Two realities shape the logic:
 *
 *  1. Which Experience did they buy? Stripe gives us back only the Checkout
 *     Session id (`sid`). The clean signal is `xid` (the challenge id) threaded
 *     onto success_url by create_checkout_session; if present we trust it.
 *     Fallback: the buyer's most-recent membership.
 *
 *  2. Entitlement is created ASYNC by the stripe_webhook. Stripe redirects here
 *     immediately, so the membership may lag a second or two. We only deep-link
 *     into the Experience Space once we can CONFIRM the membership row,
 *     otherwise the space gate would bounce them. The "first moves" card below
 *     productively fills that gap — by the time they add a photo, the webhook
 *     has landed. Profile edits don't need entitlement; the intro does (it's a
 *     cohort post), and gracefully defers to the in-space prompt if not ready.
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
    .select("display_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  // Resolve the purchased Experience + confirm entitlement.
  let challengeId: string | null = null;
  let entitled = false;

  if (xid && kind !== "session") {
    const { data: m } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .eq("user_id", user.id)
      .eq("challenge_id", xid)
      .maybeSingle();
    challengeId = xid;
    entitled = !!m;
  } else if (!xid) {
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

  // The experts' intro question for the resolved Experience (with a fallback), plus
  // whether to offer the intro NOW. Only when the run they bought is the one live
  // in its lineage: a continuation bought while a prior run is still running (the
  // buyer is "upcoming") suppresses the intro here — it'd land in a cohort they
  // aren't part of yet. The antechamber promises it at kickoff instead.
  let introPrompt = DEFAULT_INTRO_PROMPT;
  let canIntro = true;
  let chapterOpens: string | null = null;
  if (challengeId) {
    const { data: ch } = await supabase
      .from("app_challenge")
      .select("intro_prompt, continuation_group_id, start_date")
      .eq("id", challengeId)
      .maybeSingle();
    const c = ch as
      | { intro_prompt: string | null; continuation_group_id: string | null; start_date: string | null }
      | null;
    const p = c?.intro_prompt?.trim();
    if (p) introPrompt = p;
    if (c?.continuation_group_id) {
      const { data: active } = await supabase.rpc("current_active_challenge_in_group", {
        p_continuation_group: c.continuation_group_id,
      });
      if (active && active !== challengeId) {
        canIntro = false;
        chapterOpens = c.start_date;
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} role={profile?.role} />

      <div className="flex-1 pt-24 pb-16 px-6 flex items-start justify-center">
        <div className="max-w-lg w-full">
          {/* Celebration */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                backgroundColor: "rgba(220, 252, 231, 0.85)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
              }}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#047857"
                strokeWidth={2.25}
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1
              className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-2"
              style={{ color: "#0F2229" }}
            >
              You&apos;re in!
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
              Payment confirmed — a receipt is on its way.
              {challengeId
                ? " Take a moment to set yourself up, then step into your Experience."
                : " We're finalizing your enrollment — it'll appear in My Programs in a few seconds."}
            </p>
          </div>

          {challengeId ? (
            <FirstMovesCard
              challengeId={challengeId}
              entitled={entitled}
              canIntro={canIntro}
              chapterOpens={chapterOpens}
              introPrompt={introPrompt}
              initialDisplayName={profile?.display_name ?? ""}
              initialAvatarUrl={(profile?.avatar_url as string | null) ?? null}
            />
          ) : (
            <Link
              href="/me"
              className="block w-full py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.01] transition-transform text-center"
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
  );
}
