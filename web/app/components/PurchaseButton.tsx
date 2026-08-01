"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";

/** Buyer-facing message for a checkout rejection code. The Edge Function
 *  returns these as HTTP 400, which supabase-js surfaces as a
 *  FunctionsHttpError — NOT as `data` — so both branches below need this. */
function rejectionMessage(code: string | null): string {
  switch (code) {
    case "ALREADY_PURCHASED":
      return "You're already in this experience.";
    case "CHALLENGE_FULL":
      return "This experience is at capacity right now.";
    case "SESSION_FULL":
      return "This session is full.";
    default:
      return "Checkout couldn't open. Please try again in a moment.";
  }
}

interface Props {
  kind: "session" | "challenge";
  targetId: string;
  /** Simple text label — used when `children` is not provided. */
  label?: string;
  /** Rich button content (e.g. price + supporting text + action verb).
   *  Takes precedence over `label` when both are provided. Added Bundle
   *  4.2.5 so the buyer-page hero card can use a structured price-as-CTA
   *  block instead of a single-line label. */
  children?: React.ReactNode;
  className?: string;
}

export function PurchaseButton({
  kind,
  targetId,
  label,
  children,
  className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  function handleRejection(code: string | null) {
    if (code === "ALREADY_PURCHASED") {
      // Reached from a page rendered BEFORE the purchase (back-navigation,
      // old tab): the server guard correctly refused a double charge. Swap
      // the CTA for the space link and refresh so the server components
      // re-render with the real membership state.
      setAlreadyOwned(true);
      router.refresh();
    } else {
      setError(rejectionMessage(code));
    }
    setLoading(false);
  }

  async function handlePurchase() {
    setLoading(true);
    setError(null);
    trackEvent("Checkout Started", { kind });

    try {
      const supabase = createClient();

      const { data, error: fnError } = await supabase.functions.invoke(
        "create_checkout_session",
        {
          body: { kind, target_id: targetId },
        }
      );

      if (fnError) {
        // Non-2xx: the rejection body ({error: "ALREADY_PURCHASED", ...}) is
        // on the Response in fnError.context, NOT in `data`. Without reading
        // it, buyers saw the raw "Edge Function returned a non-2xx status
        // code" — which is exactly what happened on a stale buyer page.
        let code: string | null = null;
        try {
          const body = await (fnError as { context?: Response }).context?.json();
          code = typeof body?.error === "string" ? body.error : null;
        } catch {
          // body unreadable — fall through to the generic message
        }
        handleRejection(code);
        return;
      }

      if (data?.error) {
        handleRejection(typeof data.error === "string" ? data.error : null);
        return;
      }

      if (data?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
        return;
      }

      setError("No checkout URL returned.");
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  // The guard said this buyer already owns the item. Show the way in instead
  // of a buy button they must not press twice.
  if (alreadyOwned) {
    return (
      <div>
        <Link
          href={kind === "challenge" ? `/experiences/${targetId}/space` : "/me"}
          className="inline-block w-full text-center px-7 py-4 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: "#0891b2",
            boxShadow:
              "0 6px 20px rgba(8,145,178,0.30), 0 2px 6px rgba(8,145,178,0.20)",
          }}
        >
          You&apos;re in — open your {kind === "challenge" ? "experience space" : "sessions"} →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={
          className ??
          "w-full py-4 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100"
        }
        style={
          className
            ? undefined
            : {
                backgroundColor: "#FF6130",
                boxShadow:
                  "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
              }
        }
      >
        {loading ? "Redirecting to checkout..." : (children ?? label)}
      </button>
      {error && (
        <p
          className="text-xs text-center mt-2"
          style={{ color: "#FF6130" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
