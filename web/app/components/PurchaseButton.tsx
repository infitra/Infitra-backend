"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  kind: "session" | "challenge";
  targetId: string;
  label: string;
  className?: string;
}

export function PurchaseButton({ kind, targetId, label, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: fnError } = await supabase.functions.invoke(
        "create_checkout_session",
        {
          body: { kind, target_id: targetId },
        }
      );

      if (fnError) {
        setError(fnError.message || "Something went wrong.");
        setLoading(false);
        return;
      }

      if (data?.error) {
        const msg =
          data.error === "SESSION_FULL"
            ? "This session is full."
            : data.error === "CHALLENGE_FULL"
              ? "This challenge is full."
              : data.error === "ALREADY_PURCHASED"
                ? "You already have a ticket for this."
                : data.error;
        setError(msg);
        setLoading(false);
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
        {loading ? "Redirecting to checkout..." : label}
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
