// supabase/functions/stripe-webhook/index.ts
// Edge (Deno) webhook for Stripe — signature verified, idempotent, and safe status transitions.
// OPTION A (hardened in-place): keeps your economics & entitlement logic, adds stricter invariants.

import Stripe from "https://esm.sh/stripe@16.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const STRIPE_SECRET_KEY     = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY /*, { apiVersion: "<use Stripe default>" } */);
const admin  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---- Types -----------------------------------------------------------------

type CheckoutMeta = {
  kind: "session" | "challenge";
  target_id: string;            // session_id or challenge_id (uuid)
  buyer_id: string;             // uuid of the purchaser
  creator_id?: string;          // uuid of the creator (optional for sessions, required for challenge if you store it)
  currency: string;             // "CHF"
  price_cents: string | number; // sticker price cents (string in Stripe metadata)
};

type TxRow = {
  buyer_id: string;
  creator_id: string | null;
  session_id: string | null;
  challenge_id: string | null;

  provider: "stripe";
  provider_payment_id: string; // Stripe PaymentIntent id
  type: "ticket" | "bundle";
  status: "succeeded" | "pending" | "failed" | "refunded" | "canceled";

  currency: string;
  amount_gross_cents: number;
  processing_fee_fixed_cents: number;
  processing_fee_percent_cents: number;
  platform_cut_cents: number;
  creator_cut_cents: number;
  amount_after_stripe_cents: number;
};

// ---- Helpers ----------------------------------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Only allow monotonic, sensible transitions (webhooks can arrive out-of-order).
function isAllowedTransition(prev: string | null, next: string): boolean {
  if (!prev) return true;
  if (prev === next) return true;
  // From pending → succeeded/failed/canceled/refunded allowed
  if (prev === "pending" && ["succeeded", "failed", "canceled", "refunded"].includes(next)) return true;
  // Once succeeded, do not accept downgrade to failed/canceled
  if (prev === "succeeded") return ["refunded"].includes(next) ? true : false;
  // From failed/canceled → nothing else
  if (["failed", "canceled"].includes(prev)) return false;
  // From refunded → stay refunded
  if (prev === "refunded") return false;
  return false;
}

function parseMeta(md: unknown): CheckoutMeta {
  const m = (md ?? {}) as Record<string, string>;
  const out: CheckoutMeta = {
    kind: (m.kind as CheckoutMeta["kind"]) ?? (m["kind"] as any),
    target_id: m.target_id,
    buyer_id: m.buyer_id,
    creator_id: m.creator_id ?? null ?? undefined,
    currency: m.currency,
    price_cents: m.price_cents,
  } as CheckoutMeta;

  if (!out.kind || (out.kind !== "session" && out.kind !== "challenge")) {
    throw new Error("metadata.kind missing or invalid");
  }
  if (!out.target_id) throw new Error("metadata.target_id missing");
  if (!out.buyer_id)  throw new Error("metadata.buyer_id missing");
  if (!out.currency)  throw new Error("metadata.currency missing");
  if (out.price_cents === undefined || out.price_cents === null) {
    throw new Error("metadata.price_cents missing");
  }
  return out;
}

function computeEconomics(md: CheckoutMeta, totalStripeFeeCents: number) {
  const grossCents    = Number(md.price_cents);
  if (!Number.isFinite(grossCents) || grossCents < 0) {
    throw new Error("metadata.price_cents invalid");
  }
  const fixedFeeCents = 30; // buyer covers this; not split
  const percentFeeCts = Math.max(totalStripeFeeCents - fixedFeeCents, 0);
  const creatorCut    = Math.floor(grossCents * 0.80);
  const platformCut   = grossCents - creatorCut;
  const afterStripe   = grossCents - (fixedFeeCents + percentFeeCts);

  return {
    grossCents,
    fixedFeeCents,
    percentFeeCts,
    creatorCut,
    platformCut,
    afterStripe,
  };
}

async function getOrCreateEventLock(eventId: string) {
  // Your table uses (provider, provider_event_id) as PRIMARY KEY
  const { error } = await admin
    .from("webhook_event_lock")
    .insert({ provider: "stripe", provider_event_id: eventId })
    .select("provider_event_id")
    .maybeSingle();

  if (error) {
    // Duplicate → already processed
    if (error.code === "23505") {
      return { deduped: true as const };
    }
    throw error;
  }
  return { deduped: false as const };
}

async function fetchExistingTx(paymentIntentId: string) {
  const { data, error } = await admin
    .from("app_transaction")
    .select("id,status")
    .eq("provider", "stripe")
    .eq("provider_payment_id", paymentIntentId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") { // ignore "no rows"
    throw error;
  }
  return data as { id: string; status: string } | null;
}

async function insertTx(row: TxRow) {
  const { error } = await admin
    .from("app_transaction")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error && error.code !== "23505") throw error; // other errors bubble
}

async function updateTx(id: string, row: Partial<TxRow>) {
  const { error } = await admin
    .from("app_transaction")
    .update(row)
    .eq("id", id);
  if (error) throw error;
}

async function grantEntitlements(md: CheckoutMeta) {
  if (md.kind === "session") {
    await admin
      .from("app_attendance")
      .upsert(
        { session_id: md.target_id, user_id: md.buyer_id, joined_at: null },
        { onConflict: "session_id,user_id" },
      );
    return;
  }

  // Challenge → expand to sessions, upsert attendance
  const { data: sessLinks, error } = await admin
    .from("app_challenge_session")
    .select("session_id")
    .eq("challenge_id", md.target_id);

  if (error) throw error;

  if (sessLinks && sessLinks.length) {
    const rows = sessLinks.map((r) => ({
      session_id: r.session_id,
      user_id: md.buyer_id,
      joined_at: null,
    }));
    await admin
      .from("app_attendance")
      .upsert(rows, { onConflict: "session_id,user_id" });
  }
}

// ---- Main entry -------------------------------------------------------------

Deno.serve(async (req) => {
  try {
    // Stripe needs the raw body for signature verification
    const rawBody = await req.text();
    const sig     = req.headers.get("stripe-signature");

    if (!sig) return json({ code: 400, message: "Missing stripe-signature header" }, 400);
    if (!STRIPE_WEBHOOK_SECRET) return json({ code: 500, message: "Missing STRIPE_WEBHOOK_SECRET" }, 500);

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      console.error("Stripe signature verification failed", e);
      return json({ code: 400, message: "Signature verification failed", detail: String(e) }, 400);
    }

    // Idempotency: lock by (provider, provider_event_id)
    try {
      const lock = await getOrCreateEventLock(event.id);
      if (lock.deduped) {
        return json({ ok: true, deduped: true, event_id: event.id });
      }
    } catch (e) {
      console.error("webhook_event_lock error", e);
      // If lock fails for any reason other than duplicate, abort (let Stripe retry)
      return json({ code: 500, message: "Event lock failed", detail: String(e) }, 500);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;

        // Only handle fully-paid one-time payments
        if (s.mode !== "payment" || s.payment_status !== "paid") {
          return json({ ok: true, ignored: true, reason: "not a paid one-time session" });
        }

        // Metadata sanity
        let md: CheckoutMeta;
        try {
          md = parseMeta(s.metadata ?? {});
        } catch (e) {
          console.error("Bad metadata", e, s.metadata);
          return json({ code: 422, message: "Missing/invalid metadata", detail: String(e) }, 422);
        }

        const piId = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
        if (!piId) {
          console.error("Missing payment_intent on session", s.id);
          return json({ code: 422, message: "Missing payment_intent on session" }, 422);
        }

        // Get Stripe fee from balance transaction (most reliable)
        let totalFeeCents = 0;
        try {
          const pi = await stripe.paymentIntents.retrieve(piId, {
            expand: ["latest_charge.balance_transaction"],
          });
          const bt = (pi.latest_charge as Stripe.Charge | null)?.balance_transaction as Stripe.BalanceTransaction | null;
          totalFeeCents = bt?.fee ?? 0;
        } catch (e) {
          console.error("Stripe PI retrieve failed", e);
          return json({ code: 502, message: "Stripe retrieve PI failed", detail: String(e) }, 502);
        }

        // Economics (cents-only model)
        let math;
        try {
          math = computeEconomics(md, totalFeeCents);
        } catch (e) {
          console.error("Economics compute failed", e);
          return json({ code: 422, message: "Economics compute failed", detail: String(e) }, 422);
        }

        // Prepare row
        const baseRow: TxRow = {
          buyer_id: md.buyer_id,
          creator_id: md.creator_id ?? null,
          session_id: md.kind === "session" ? md.target_id : null,
          challenge_id: md.kind === "challenge" ? md.target_id : null,

          provider: "stripe",
          provider_payment_id: piId,
          type: md.kind === "session" ? "ticket" : "bundle",
          status: "succeeded",

          currency: md.currency,
          amount_gross_cents: math.grossCents,
          processing_fee_fixed_cents: math.fixedFeeCents,
          processing_fee_percent_cents: math.percentFeeCts,
          platform_cut_cents: math.platformCut,
          creator_cut_cents: math.creatorCut,
          amount_after_stripe_cents: math.afterStripe,
        };

        // Upsert safely by business key, with status transition guard
        try {
          const existing = await fetchExistingTx(piId);
          if (!existing) {
            await insertTx(baseRow);
          } else {
            if (!isAllowedTransition(existing.status, "succeeded")) {
              // Keep original; do not overwrite a terminal or higher-status record
              return json({ ok: true, ignored: true, reason: `transition ${existing.status} → succeeded not allowed` });
            }
            await updateTx(existing.id, baseRow);
          }
        } catch (e) {
          console.error("Transaction upsert failed", e);
          return json({ code: 500, message: "DB upsert failed", detail: String(e) }, 500);
        }

        // Entitlements
        try {
          await grantEntitlements(md);
        } catch (e) {
          console.error("Entitlement grant failed", e);
          // Return 200 so Stripe does not retry forever; ops can re-grant via admin RPC
          return json({ ok: true, warning: "entitlement grant failed; re-grant via admin tool", detail: String(e) });
        }

        return json({ ok: true, event: event.type, processed: true });
      }

      // We key off checkout.session.completed because it carries our metadata
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
      case "charge.refunded":
      default:
        // Ignored events (or future extension points)
        return json({ ok: true, event: event.type, ignored: true });
    }
  } catch (e) {
    console.error("Unhandled stripe-webhook error", e);
    return json({ code: 500, message: "Unhandled", detail: String(e) }, 500);
  }
});