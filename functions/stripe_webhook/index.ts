// supabase/functions/stripe-webhook/index.ts
// Edge (Deno) webhook for Stripe — signature verified, idempotent, and safe status transitions.
// OPTION A (hardened in-place): keeps your economics & entitlement logic, adds stricter invariants.

import Stripe from "https://esm.sh/stripe@16.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const STRIPE_SECRET_KEY     = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY);
const admin  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---- Types -----------------------------------------------------------------
type CheckoutMeta = {
  kind: "session" | "challenge";
  target_id: string;
  buyer_id: string;
  creator_id?: string;
  currency: string;
  price_cents: string | number;
};

type TxRow = {
  buyer_id: string;
  creator_id: string | null;
  session_id: string | null;
  challenge_id: string | null;
  provider: "stripe";
  provider_payment_id: string;
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

// ---- Helpers ---------------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAllowedTransition(prev: string | null, next: string): boolean {
  if (!prev) return true;
  if (prev === next) return true;
  if (prev === "pending" && ["succeeded", "failed", "canceled", "refunded"].includes(next)) return true;
  if (prev === "succeeded") return ["refunded"].includes(next);
  if (["failed", "canceled", "refunded"].includes(prev)) return false;
  return false;
}

function parseMeta(md: unknown): CheckoutMeta {
  const m = (md ?? {}) as Record<string, string>;
  const out: CheckoutMeta = {
    kind: (m.kind as any),
    target_id: m.target_id,
    buyer_id: m.buyer_id,
    creator_id: m.creator_id ?? null ?? undefined,
    currency: m.currency,
    price_cents: m.price_cents,
  };
  if (!out.kind || !["session", "challenge"].includes(out.kind)) throw new Error("metadata.kind invalid");
  if (!out.target_id) throw new Error("metadata.target_id missing");
  if (!out.buyer_id) throw new Error("metadata.buyer_id missing");
  if (!out.currency) throw new Error("metadata.currency missing");
  if (out.price_cents == null) throw new Error("metadata.price_cents missing");
  return out;
}

function computeEconomics(md: CheckoutMeta, totalStripeFeeCents: number) {
  const grossCents = Number(md.price_cents);
  if (!Number.isFinite(grossCents) || grossCents < 0) throw new Error("metadata.price_cents invalid");
  const fixedFeeCents = 30;
  const percentFeeCts = Math.max(totalStripeFeeCents - fixedFeeCents, 0);
  const creatorCut = Math.floor(grossCents * 0.8);
  const platformCut = grossCents - creatorCut;
  const afterStripe = grossCents - (fixedFeeCents + percentFeeCts);
  return { grossCents, fixedFeeCents, percentFeeCts, creatorCut, platformCut, afterStripe };
}

async function getOrCreateEventLock(eventId: string) {
  const { error } = await admin
    .from("webhook_event_lock")
    .insert({ provider: "stripe", provider_event_id: eventId })
    .select("provider_event_id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { deduped: true as const };
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
  if (error && error.code !== "PGRST116") throw error;
  return data as { id: string; status: string } | null;
}

async function insertTx(row: TxRow) {
  const { error } = await admin.from("app_transaction").insert(row).select("id").maybeSingle();
  if (error && error.code !== "23505") throw error;
}

async function updateTx(id: string, row: Partial<TxRow>) {
  const { error } = await admin.from("app_transaction").update(row).eq("id", id);
  if (error) throw error;
}

async function grantEntitlements(md: CheckoutMeta) {
  if (md.kind === "session") {
    await admin.from("app_attendance").upsert(
      { session_id: md.target_id, user_id: md.buyer_id, joined_at: null },
      { onConflict: "session_id,user_id" },
    );
    return;
  }
  const { data: sessLinks, error } = await admin
    .from("app_challenge_session")
    .select("session_id")
    .eq("challenge_id", md.target_id);
  if (error) throw error;
  if (sessLinks?.length) {
    const rows = sessLinks.map(r => ({
      session_id: r.session_id,
      user_id: md.buyer_id,
      joined_at: null,
    }));
    await admin.from("app_attendance").upsert(rows, { onConflict: "session_id,user_id" });
  }
}

// ---- Main entry ------------------------------------------------------------
Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) return json({ code: 400, message: "Missing stripe-signature header" }, 400);
    if (!STRIPE_WEBHOOK_SECRET) return json({ code: 500, message: "Missing STRIPE_WEBHOOK_SECRET" }, 500);

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      console.error("Stripe signature verification failed", e);
      return json({ code: 400, message: "Signature verification failed", detail: String(e) }, 400);
    }

    const lock = await getOrCreateEventLock(event.id);
    if (lock.deduped) return json({ ok: true, deduped: true, event_id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode !== "payment" || s.payment_status !== "paid") {
          return json({ ok: true, ignored: true, reason: "not a paid one-time session" });
        }

        let md: CheckoutMeta;
        try { md = parseMeta(s.metadata ?? {}); }
        catch (e) { console.error("Bad metadata", e, s.metadata); return json({ code: 422, message: "Invalid metadata", detail: String(e) }, 422); }

        const piId = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
        if (!piId) return json({ code: 422, message: "Missing payment_intent on session" }, 422);

        let totalFeeCents = 0;
        try {
          const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge.balance_transaction"] });
          const bt = (pi.latest_charge as Stripe.Charge | null)?.balance_transaction as Stripe.BalanceTransaction | null;
          totalFeeCents = bt?.fee ?? 0;
        } catch (e) {
          console.error("Stripe PI retrieve failed", e);
          return json({ code: 502, message: "Stripe retrieve PI failed", detail: String(e) }, 502);
        }

        let math;
        try { math = computeEconomics(md, totalFeeCents); }
        catch (e) { console.error("Economics compute failed", e); return json({ code: 422, message: "Economics compute failed", detail: String(e) }, 422); }

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

        try {
          const existing = await fetchExistingTx(piId);
          if (!existing) await insertTx(baseRow);
          else if (isAllowedTransition(existing.status, "succeeded")) await updateTx(existing.id, baseRow);
          else return json({ ok: true, ignored: true, reason: `transition ${existing.status} → succeeded not allowed` });
        } catch (e) {
          console.error("Transaction upsert failed", e);
          return json({ code: 500, message: "DB upsert failed", detail: String(e) }, 500);
        }

        try {
          await grantEntitlements(md);
        } catch (e) {
          console.error("Entitlement grant failed", e);
          return json({ ok: true, warning: "entitlement grant failed", detail: String(e) });
        }

        // 📨 Enqueue receipt (add-on)
        try {
          const { data: txRow } = await admin
            .from("app_transaction")
            .select("id")
            .eq("provider", "stripe")
            .eq("provider_payment_id", piId)
            .single();

          if (txRow?.id) {
            const { error: enqErr } = await admin.rpc("admin_email_enqueue_receipt", { p_tx_id: txRow.id });
            if (enqErr) console.error("enqueue receipt failed", enqErr);
          }
        } catch (e) {
          console.error("enqueue receipt exception", e);
        }

        return json({ ok: true, event: event.type, processed: true });
      }

      default:
        return json({ ok: true, event: event.type, ignored: true });
    }
  } catch (e) {
    console.error("Unhandled stripe-webhook error", e);
    return json({ code: 500, message: "Unhandled", detail: String(e) }, 500);
  }
});