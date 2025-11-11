// Supabase Edge Function: create_checkout_session
// Creates a Stripe Checkout Session.
// - Toggle controls fee presentation (false = base+0.30; true = base+3%+0.30)
// - Adds rate limiting via edge_rate_limit_use()
// Response: { checkout_url, session_id }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------- Helpers (keep these ABOVE any uses) ----------
const toInt = (v: unknown, def = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
};
const upper = (s?: string | null) => (s || "CHF").toUpperCase();
const pickIp = (req: Request) =>
  req.headers.get("x-forwarded-for") ||
  req.headers.get("x-real-ip") ||
  req.headers.get("cf-connecting-ip") ||
  req.headers.get("fly-client-ip") ||
  null;

// ---------- CONFIG ----------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_KEY   = Deno.env.get("STRIPE_SECRET_KEY")!;
const PROJECT_URL  = (Deno.env.get("PROJECT_URL") || "").replace(/\/+$/, "");

// ---- Buyer fee toggle ----
const BUYER_ABSORBS_FEES = true;          // false = base+0.30; true = 3% + CHF0.30
const FIXED_FEE_CENTS    = 30;
const PERCENT_FEE_RATE   = 0.03;

// ---- Rate limiting (env overrides optional) ----
const RATE_LIMIT_ENABLED        = (Deno.env.get("RATE_LIMIT_ENABLED") ?? "true").toLowerCase() === "true";
const RATE_LIMIT_WINDOW_SECONDS = toInt(Deno.env.get("RATE_LIMIT_WINDOW_SECONDS") ?? "60", 60);
const RATE_LIMIT_PER_USER       = toInt(Deno.env.get("RATE_LIMIT_PER_USER") ?? "5", 5);
const RATE_LIMIT_PER_IP         = toInt(Deno.env.get("RATE_LIMIT_PER_IP") ?? "20", 20);

// ---------- Stripe minimal client ----------
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

// ---------- Types ----------
type Kind = "session" | "challenge";
type DbSession   = { id:string; title:string; price_cents:number; currency:string; host_id:string;   status:string };
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

    // 1b) Rate limit
    const ip = pickIp(req);
    if (RATE_LIMIT_ENABLED) {
      const { error: rlErr } = await admin.rpc("edge_rate_limit_use", {
        p_fn: "create_checkout_session",
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        p_limit_per_user: RATE_LIMIT_PER_USER,
        p_limit_per_ip: RATE_LIMIT_PER_IP,
        p_user_id: buyerId,
        p_ip: ip,
      });
      if (rlErr) {
        const msg = `${rlErr.message || ""}`.toLowerCase();
        if (msg.includes("rate_limited")) return json({ error: "Too Many Requests" }, 429);
        return json({ error: "Rate limit check failed", detail: rlErr.message }, 500);
      }
    }

    // 2) Input
    const { kind, target_id } = await req.json();
    if (!kind || !target_id) return json({ error: "Missing kind or target_id" }, 400);
    if (kind !== "session" && kind !== "challenge") return json({ error: "Invalid kind" }, 400);

    // 3) Load product
    let title = "", baseCents = 0, currency = "CHF", creatorId = "";
    if (kind === "session") {
      const { data: s, error } = await admin
        .from("app_session")
        .select("id,title,price_cents,currency,host_id,status")
        .eq("id", target_id)
        .single<DbSession>();
      if (error || !s) return json({ error: "Session not found" }, 404);
      if (s.status !== "published") return json({ error: "Session not published" }, 400);
      title = s.title; baseCents = toInt(s.price_cents); currency = upper(s.currency); creatorId = s.host_id;
    } else {
      const { data: c, error } = await admin
        .from("app_challenge")
        .select("id,title,price_cents,currency,owner_id,status")
        .eq("id", target_id)
        .single<DbChallenge>();
      if (error || !c) return json({ error: "Challenge not found" }, 404);
      if (c.status !== "published") return json({ error: "Challenge not published" }, 400);
      title = c.title; baseCents = toInt(c.price_cents); currency = upper(c.currency); creatorId = c.owner_id;
    }
    if (baseCents <= 0) return json({ error: "Invalid price" }, 400);

    // 4) URLs
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
      fee_model: BUYER_ABSORBS_FEES ? "buyer_absorbs_3pct_plus_030" : "buyer_fixed_030"
    };

    const body = new URLSearchParams({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: `${kind}:${target_id}:${buyerId}`,
      ...Object.fromEntries(Object.entries(md).map(([k,v]) => [`metadata[${k}]`, v])),
    });

    // 6) Line items (same logic as before)
    if (BUYER_ABSORBS_FEES) {
      const totalCents = Math.ceil((baseCents + FIXED_FEE_CENTS) / (1 - PERCENT_FEE_RATE));
      let percentCents = totalCents - baseCents - FIXED_FEE_CENTS;
      if (percentCents < 0) percentCents = 0;
      body.set("metadata[buyer_fee_percent_cents]", String(percentCents));
      body.set("metadata[buyer_fee_fixed_cents]",   String(FIXED_FEE_CENTS));
      body.set("metadata[buyer_total_cents]",       String(totalCents));

      addLineItem(body, { name: kind === "session" ? `Session · ${title}` : `Challenge · ${title}`, currency, unit_amount: baseCents, quantity: 1 });
      if (percentCents > 0) addLineItem(body, { name: "Card processing (3%)", currency, unit_amount: percentCents, quantity: 1 });
      addLineItem(body, { name: "Fixed fee (CHF 0.30)", currency, unit_amount: FIXED_FEE_CENTS, quantity: 1 });
    } else {
      addLineItem(body, { name: kind === "session" ? `Session · ${title}` : `Challenge · ${title}`, currency, unit_amount: baseCents, quantity: 1 });
      addLineItem(body, { name: "Processing fee", currency, unit_amount: FIXED_FEE_CENTS, quantity: 1 });
    }

    // 7) Create Checkout Session
    const sess = await stripe("/checkout/sessions", body);
    return json({ checkout_url: sess.url as string, session_id: sess.id as string });

  } catch (e) {
    // Preserve your generic error shape
    return json({ error: String(e) }, 500);
  }
});

// ---------- helpers ----------
function addLineItem(body: URLSearchParams, opts: { name:string; currency:string; unit_amount:number; quantity:number }) {
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
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}