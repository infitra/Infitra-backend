// Supabase Edge Function: create_checkout_session
// Purpose:
//   - Creates a Stripe Checkout Session (TEST mode).
//   - With BUYER_ABSORBS_FEES toggle, you can switch between:
//       false → buyer pays base + CHF 0.30 fixed fee
//       true  → buyer pays base + 0.30 CHF + 3 % (grossed-up total)
//   - Returns { checkout_url, session_id }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------- CONFIG ----------
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_KEY     = Deno.env.get("STRIPE_SECRET_KEY")!;
const PROJECT_URL    = (Deno.env.get("PROJECT_URL") || "").replace(/\/+$/, "");

// ---- Toggle: switch buyer fee behaviour here ----
const BUYER_ABSORBS_FEES = false;          // <—— flip to true for 0.30 + 3 %
const FIXED_FEE_CENTS     = 30;
const PERCENT_FEE_RATE    = 0.03;          // 3 % safety rate when toggle = true

// ---------- Helpers ----------
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
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
const toInt = (v: unknown, def = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
};
const upper = (s?: string | null) => (s || "CHF").toUpperCase();

// ---------- Types ----------
type Kind = "session" | "challenge";
type DbSession = { id:string; title:string; price_cents:number; currency:string; host_id:string; status:string };
type DbChallenge = { id:string; title:string; price_cents:number; currency:string; owner_id:string; status:string };

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// ---------- Handler ----------
Deno.serve(async (req) => {
  try {
    // 1) Auth
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const caller = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: u, error: uErr } = await caller.auth.getUser();
    if (uErr || !u?.user) return json({ error: "Unauthorized" }, 401);
    const buyerId = u.user.id;

    // 2) Parse input
    const { kind, target_id } = await req.json();
    if (!kind || !target_id) return json({ error: "Missing kind or target_id" }, 400);
    if (kind !== "session" && kind !== "challenge") return json({ error: "Invalid kind" }, 400);

    // 3) Fetch product
    let title = "", amountGrossCents = 0, currency = "CHF", creatorId = "";
    if (kind === "session") {
      const { data: s, error } = await admin
        .from("app_session")
        .select("id,title,price_cents,currency,host_id,status")
        .eq("id", target_id)
        .single<DbSession>();
      if (error || !s) return json({ error: "Session not found" }, 404);
      if (s.status !== "published") return json({ error: "Session not published" }, 400);
      ({ title, price_cents: amountGrossCents, currency, host_id: creatorId } = s);
    } else {
      const { data: c, error } = await admin
        .from("app_challenge")
        .select("id,title,price_cents,currency,owner_id,status")
        .eq("id", target_id)
        .single<DbChallenge>();
      if (error || !c) return json({ error: "Challenge not found" }, 404);
      if (c.status !== "published") return json({ error: "Challenge not published" }, 400);
      ({ title, price_cents: amountGrossCents, currency, owner_id: creatorId } = c);
    }

    const baseCents = toInt(amountGrossCents);
    if (baseCents <= 0) return json({ error: "Invalid price" }, 400);
    currency = upper(currency);

    // 4) Success / cancel URLs
    const successUrl = PROJECT_URL
      ? `${PROJECT_URL}/checkout/success?sid={CHECKOUT_SESSION_ID}`
      : "https://example.com/checkout/success?sid={CHECKOUT_SESSION_ID}";
    const cancelUrl  = PROJECT_URL
      ? `${PROJECT_URL}/checkout/cancel`
      : "https://example.com/checkout/cancel";

    // 5) Metadata
    const md: Record<string,string> = {
      kind, target_id, buyer_id: buyerId, creator_id: creatorId,
      price_cents: String(baseCents), currency,
      fee_model: BUYER_ABSORBS_FEES ? "buyer_absorbs" : "buyer_fixed30"
    };

    // 6) Stripe payload
    const body = new URLSearchParams({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: `${kind}:${target_id}:${buyerId}`,
      ...Object.fromEntries(Object.entries(md).map(([k,v]) => [`metadata[${k}]`, v]))
    });

    // --------- Fee logic ----------
    if (BUYER_ABSORBS_FEES) {
      // Buyer pays base + fixed + percent
      const totalCents = Math.ceil((baseCents + FIXED_FEE_CENTS) / (1 - PERCENT_FEE_RATE));
      const surchargeCents = totalCents - baseCents;
      body.set("metadata[buyer_fee_cents_est]", String(surchargeCents));

      addLineItem(body, {
        name: kind === "session" ? `Session · ${title}` : `Challenge · ${title}`,
        currency,
        unit_amount: totalCents,
        quantity: 1
      });
    } else {
      // Buyer pays base + separate CHF 0.30 line item
      addLineItem(body, {
        name: kind === "session" ? `Session · ${title}` : `Challenge · ${title}`,
        currency,
        unit_amount: baseCents,
        quantity: 1
      });
      addLineItem(body, {
        name: "Processing fee",
        currency,
        unit_amount: FIXED_FEE_CENTS,
        quantity: 1
      });
    }

    // 7) Create Checkout Session
    const sess = await stripe("/checkout/sessions", body);

    return json({ checkout_url: sess.url as string, session_id: sess.id as string });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

// ---------- helpers ----------
function addLineItem(
  body: URLSearchParams,
  opts: { name:string; currency:string; unit_amount:number; quantity:number }
) {
  const idx = nextIndex(body);
  body.set(`line_items[${idx}][price_data][currency]`, opts.currency.toLowerCase());
  body.set(`line_items[${idx}][price_data][product_data][name]`, opts.name);
  body.set(`line_items[${idx}][price_data][unit_amount]`, String(opts.unit_amount));
  body.set(`line_items[${idx}][quantity]`, String(opts.quantity));
}
function nextIndex(params: URLSearchParams) {
  let max = -1;
  for (const key of params.keys()) {
    const m = key.match(/line_items\[(\d+)\]\[price_data\]\[currency\]/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}