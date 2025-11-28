// supabase/functions/monthly_badges/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("CRON_SECRET")!;
const MONTHLY_SYSTEM_ADMIN_ID = Deno.env.get("MONTHLY_SYSTEM_ADMIN_ID")!;

if (!SUPABASE_URL || !SERVICE_ROLE || !CRON_SECRET || !MONTHLY_SYSTEM_ADMIN_ID) {
  console.error("monthly_badges: missing required env vars");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Compute last full month (period string "YYYY-MM")
function getLastMonthPeriod() {
  const now = new Date();
  // Move to previous month
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-based; now is current month
  const lastMonth = month === 0 ? 11 : month - 1;
  const lastYear = month === 0 ? year - 1 : year;

  const mm = String(lastMonth + 1).padStart(2, "0");
  return {
    period: `${lastYear}-${mm}`,
    year: lastYear,
    month: lastMonth + 1,
  };
}

async function callRpc(
  fn: string,
  params: Record<string, unknown> = {},
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await admin.rpc(fn, params);
  if (error) {
    console.error(`monthly_badges: ${fn} failed`, error);
    return { ok: false, error: error.message || String(error) };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  try {
    // Simple auth via header
    const secret = req.headers.get("x-cron-secret");
    if (!secret || secret !== CRON_SECRET) {
      return json({ ok: false, error: "forbidden" }, 403);
    }

    // Allow manual override via JSON body: { period?: "YYYY-MM", year?: number, month?: number }
    let body: any = {};
    try {
      if (req.body) {
        const text = await req.text();
        if (text) body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    const fallback = getLastMonthPeriod();
    const year = body.year ?? fallback.year;
    const month = body.month ?? fallback.month;
    const period: string = body.period ?? fallback.period;

    const steps: Array<{ fn: string; ok: boolean; error?: string }> = [];

    // 1) Run ranking badge engines (attendance, creator metrics, etc.)
    const fns = [
      "admin_run_monthly_attendance_badges",
      "admin_run_monthly_creator_attendance_badges",
      "admin_run_monthly_creator_follower_badges",
      "admin_run_monthly_creator_revenue_badges",
      "admin_run_monthly_participant_growth_badges",
    ];

    for (const fn of fns) {
      const res = await callRpc(fn, { p_year: year, p_month: month });
      steps.push({ fn, ...res });
    }

    // 2) Generate digest & notifications (now with explicit admin id)
    const digestRes = await callRpc(
      "admin_generate_monthly_badge_digest",
      {
        p_period: period,
        p_admin_id: MONTHLY_SYSTEM_ADMIN_ID,
      },
    );
    steps.push({ fn: "admin_generate_monthly_badge_digest", ...digestRes });

    const ok = steps.every((s) => s.ok);

    return json({
      ok,
      period,
      year,
      month,
      steps,
    });
  } catch (e) {
    console.error("monthly_badges: unexpected error", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});