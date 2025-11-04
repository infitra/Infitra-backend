// Supabase Edge Function: create_checkout_session
// Purpose:
// - Creates a Stripe Checkout Session (TEST mode).
// - Locks price from DB (cents), adds a buyer fixed fee (CHF 0.30) as a separate line item.
// - Stamps deterministic metadata so the webhook can link the purchase.
// - Returns { checkout_url, session_id }.
//
// Assumptions:
// - app_session: price_cents (int/bigint), currency (3-letter), host_id, title, status
// - app_challenge: price_cents, currency, owner_id, title, status
// - You’re charging in CHF for now (other currencies still pass through, but fixed fee remains 30 cents)
//
// Request JSON:
//   {
//     "kind": "session" | "challenge",
//     "target_id": "<uuid>"
//   }
//
// Response JSON:
//   { "checkout_url": string, "session_id": string }
//
// Secrets required:
//   STRIPE_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   PROJECT_URL (for success/cancel URLs)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------- ENV ----------
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_KEY     = Deno.env.get("STRIPE_SECRET_KEY")!;
const PROJECT_URL    = (Deno.env.get("PROJECT_URL") || "").replace(/\/+$/, ""); // no trailing slash

// Stripe REST
const STRIPE_API = "https://api.stripe.com/v1";
const stripe = async (path: string, body: URLSearchParams) => {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Stripe ${path} failed: ${txt}`);
  }
  return res.json();
};

// Helpers
const toInt = (v: unknown, def = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
};
const upper = (s?: string | null) => (s || "CHF").toUpperCase();

// Fixed buyer fee: 30 cents (CHF)
const FIXED_FEE_CENTS = 30;

type Kind = "session" | "challenge";

type DbSession = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  host_id: string;
  status: string;
};

type DbChallenge = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  owner_id: string;
  status: string;
};

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

Deno.serve(async (req) => {
  try {
    // 1) Auth: require a valid Supabase JWT (to determine buyer_id)
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const caller = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: u, error: uErr } = await caller.auth.getUser();
    if (uErr || !u?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const buyerId = u.user.id;

    // 2) Parse body
    const { kind, target_id } = await req.json();
    if (!kind || !target_id) {
      return json({ error: "Missing kind or target_id" }, 400);
    }
    if (kind !== "session" && kind !== "challenge") {
      return json({ error: "Invalid kind" }, 400);
    }

    // 3) Fetch product from DB and validate status
    let title = "";
    let amountGrossCents = 0;
    let currency = "CHF";
    let creatorId = "";
    if (kind === "session") {
      const { data: s, error } = await admin
        .from("app_session")
        .select("id, title, price_cents, currency, host_id, status")
        .eq("id", target_id)
        .single<DbSession>();
      if (error || !s) return json({ error: "Session not found" }, 404);
      if (s.status !== "published") return json({ error: "Session not published" }, 400);

      title = s.title || "Session";
      amountGrossCents = toInt(s.price_cents);
      currency = upper(s.currency);
      creatorId = s.host_id;
    } else {
      const { data: c, error } = await admin
        .from("app_challenge")
        .select("id, title, price_cents, currency, owner_id, status")
        .eq("id", target_id)
        .single<DbChallenge>();
      if (error || !c) return json({ error: "Challenge not found" }, 404);
      if (c.status !== "published") return json({ error: "Challenge not published" }, 400);

      title = c.title || "Challenge";
      amountGrossCents = toInt(c.price_cents);
      currency = upper(c.currency);
      creatorId = c.owner_id;
    }

    if (amountGrossCents <= 0) {
      return json({ error: "Invalid price" }, 400);
    }

    // 4) Build Stripe Checkout payload (two line items: sticker + fixed fee)
    // success/cancel URLs
    const successUrl = PROJECT_URL
      ? `${PROJECT_URL}/checkout/success?sid={CHECKOUT_SESSION_ID}`
      : "https://example.com/checkout/success?sid={CHECKOUT_SESSION_ID}";
    const cancelUrl = PROJECT_URL
      ? `${PROJECT_URL}/checkout/cancel`
      : "https://example.com/checkout/cancel";

    // Metadata to allow webhook to link the purchase deterministically
    const md: Record<string, string> = {
      kind,
      target_id,
      buyer_id: buyerId,
      creator_id: creatorId,
      price_cents: String(amountGrossCents),
      currency,
    };

    // Stripe form body
    const body = new URLSearchParams({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      // client_reference_id is helpful for later reconciliation
      client_reference_id: `${kind}:${target_id}:${buyerId}`,
      "metadata[kind]": md.kind,
      "metadata[target_id]": md.target_id,
      "metadata[buyer_id]": md.buyer_id,
      "metadata[creator_id]": md.creator_id,
      "metadata[price_cents]": md.price_cents,
      "metadata[currency]": md.currency,
      // Allow promotion codes later if you need:
      // allow_promotion_codes: "true",
    });

    // Line item 1: the product sticker price (creator-facing)
    addLineItem(body, {
      name: kind === "session" ? `Session · ${title}` : `Challenge · ${title}`,
      currency,
      unit_amount: amountGrossCents,
      quantity: 1,
    });

    // Line item 2: buyer fixed fee (CHF 0.30) — platform cost recovery
    // Only add if charging in CHF (your current model); otherwise you can skip or adapt.
    // We’ll still add for any currency; your webhook currently subtracts 30 regardless.
    addLineItem(body, {
      name: "Processing fee",
      currency,
      unit_amount: FIXED_FEE_CENTS,
      quantity: 1,
    });

    // 5) Create the session
    const sess = await stripe("/checkout/sessions", body);

    return json({
      checkout_url: sess.url as string,
      session_id: sess.id as string,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

// ------------- helpers -------------

function addLineItem(
  body: URLSearchParams,
  opts: { name: string; currency: string; unit_amount: number; quantity: number }
) {
  const idx = nextIndex(body, /^line_items\[\d+\]\[price_data\]\[currency\]$/);
  body.set(`line_items[${idx}][price_data][currency]`, opts.currency.toLowerCase());
  body.set(`line_items[${idx}][price_data][product_data][name]`, opts.name);
  body.set(`line_items[${idx}][price_data][unit_amount]`, String(opts.unit_amount));
  body.set(`line_items[${idx}][quantity]`, String(opts.quantity));
}

function nextIndex(params: URLSearchParams, re: RegExp) {
  let max = -1;
  for (const key of params.keys()) {
    const m = key.match(/line_items\[(\d+)\]\[price_data\]\[currency\]/);
    if (m) {
      const i = Number(m[1]);
      if (Number.isFinite(i)) max = Math.max(max, i);
    }
  }
  return max + 1;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}