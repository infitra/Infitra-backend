// supabase/functions/stripe-webhook/index.ts
// Edge (Deno) webhook for Stripe — uses constructEventAsync (required on Edge)
// Verifies signature, idempotent processing, and records transactions.

import Stripe from "https://esm.sh/stripe@16.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const STRIPE_SECRET_KEY     = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.clover" });
const admin  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type CheckoutMeta = {
  kind: "session" | "challenge";
  target_id: string;               // session_id or challenge_id (uuid)
  buyer_id: string;                // uuid
  creator_id?: string;             // uuid
  currency: string;                // "CHF"
  price_cents: string | number;    // base price in cents (string in metadata)
};

Deno.serve(async (req) => {
  try {
    // 0) Stripe requires the *raw* body string for signature verification
    const rawBody = await req.text();
    const sig     = req.headers.get("stripe-signature");

    if (!sig) {
      return json({ code: 400, message: "Missing stripe-signature header" }, 400);
    }
    if (!STRIPE_WEBHOOK_SECRET) {
      return json({ code: 500, message: "Missing STRIPE_WEBHOOK_SECRET" }, 500);
    }

    // 1) Verify signature (Edge must use the ASYNC API)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      return json({
        code: 400,
        message: "Signature verification failed",
        detail: String(e),
      }, 400);
    }

    // 2) Idempotency guard (lightweight): ignore if we’ve seen this event before
    const lock = await admin.from("webhook_event_lock")
      .insert({ id: event.id, provider: "stripe" })
      .select("id")
      .maybeSingle();

    // If the insert failed due to duplicate key, we've processed it
    if (lock.error && lock.error.code === "23505") {
      return json({ ok: true, deduped: true, event_id: event.id }, 200);
    }

    // 3) Handle events we care about
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;

        // Only process if fully paid (mode: payment + paid)
        if (s.mode !== "payment" || s.payment_status !== "paid") {
          break;
        }

        // Pull metadata (we set it when creating the Checkout Session)
        const md = (s.metadata ?? {}) as unknown as CheckoutMeta;
        if (!md.kind || !md.target_id || !md.buyer_id || !md.currency || !md.price_cents) {
          return json({ code: 422, message: "Missing required metadata" }, 422);
        }

        // Resolve the PaymentIntent so we can read Stripe fees (test mode OK)
        const piId = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
        if (!piId) {
          return json({ code: 422, message: "Missing payment_intent on session" }, 422);
        }
        const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge.balance_transaction"] });

        // Stripe fees from BalanceTransaction (best source of truth)
        const bt = (pi.latest_charge as Stripe.Charge | null)?.balance_transaction as Stripe.BalanceTransaction | null;
        const totalFeeCents = bt?.fee ?? 0;

        // Economics
        const grossCents     = Number(md.price_cents);   // base sticker price (without +0.30)
        const fixedFeeCents  = 30;                       // buyer covers this; not split
        const percentFeeCts  = Math.max(totalFeeCents - fixedFeeCents, 0); // remainder is % part
        const creatorCut     = Math.floor(grossCents * 0.80);
        const platformCut    = grossCents - creatorCut;
        const afterStripe    = grossCents - (fixedFeeCents + percentFeeCts);

        // Persist transaction (idempotent by provider_payment_id unique index ideally)
        const insert = await admin.from("app_transaction").insert({
          buyer_id: md.buyer_id,
          creator_id: md.creator_id ?? null,
          session_id: md.kind === "session"   ? md.target_id : null,
          challenge_id: md.kind === "challenge" ? md.target_id : null,

          provider: "stripe",
          provider_payment_id: pi.id,
          type: md.kind === "session" ? "ticket" : "bundle",
          status: "succeeded",

          currency: md.currency,
          amount_gross_cents: grossCents,
          processing_fee_fixed_cents: fixedFeeCents,
          processing_fee_percent_cents: percentFeeCts,
          platform_cut_cents: platformCut,
          creator_cut_cents: creatorCut,
          amount_after_stripe_cents: afterStripe,
        }).select("id").maybeSingle();

        if (insert.error) {
          // If duplicate key, treat as success (idempotent); else bubble error
          if (insert.error.code !== "23505") {
            return json({ code: 500, message: "DB insert failed", detail: insert.error.message }, 500);
          }
        }

        // Optional: auto-entitle buyer to sessions (challenge or single session)
        if (md.kind === "session") {
          await admin.from("app_attendance").upsert(
            { session_id: md.target_id, user_id: md.buyer_id, joined_at: null },
            { onConflict: "session_id,user_id" }
          );
        } else {
          // challenge: entitle to all linked sessions
          const { data: sessLinks } = await admin
            .from("app_challenge_session")
            .select("session_id")
            .eq("challenge_id", md.target_id);
          if (sessLinks && sessLinks.length) {
            const rows = sessLinks.map((r) => ({
              session_id: r.session_id,
              user_id: md.buyer_id,
              joined_at: null,
            }));
            await admin.from("app_attendance").upsert(rows, { onConflict: "session_id,user_id" });
          }
        }

        break;
      }

      case "payment_intent.succeeded":
        // nothing to do; we key off checkout.session.completed for the metadata
        break;

      default:
        // ignore others
        break;
    }

    return json({ ok: true, event: event.type }, 200);
  } catch (e) {
    return json({ code: 500, message: "Unhandled", detail: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}