// supabase/functions/monthly_badges/index.ts
// Orchestrates all monthly badge jobs + digest for the *previous* calendar month.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Compute the *previous* calendar month.
// Example: running on 2025-03-05 → (year=2025, month=2, period="2025-02").
function getPreviousMonthPeriod() {
  const now = new Date();

  let year = now.getUTCFullYear();
  let monthIndex = now.getUTCMonth(); // 0–11 for current month

  // Move one month back
  if (monthIndex === 0) {
    year -= 1;
    monthIndex = 11; // December of previous year
  } else {
    monthIndex -= 1;
  }

  const monthNumber = monthIndex + 1; // 1–12
  const period = `${year}-${String(monthNumber).padStart(2, "0")}`;

  return { year, month: monthNumber, period };
}

Deno.serve(async (req) => {
  try {
    // Simple auth: only callers with the shared CRON_SECRET header are allowed.
    const hdr = req.headers.get("x-cron-secret");
    if (!hdr || hdr !== CRON_SECRET) {
      return json({ ok: false, error: "forbidden" }, 403);
    }

    const { year, month, period } = getPreviousMonthPeriod();

    const steps: Array<{ fn: string; ok: boolean; error?: string }> = [];

    async function call(fn: string, params: Record<string, unknown>) {
      const { error } = await admin.rpc(fn, params);
      if (error) {
        steps.push({ fn, ok: false, error: error.message });
      } else {
        steps.push({ fn, ok: true });
      }
    }

    // 1) Run all monthly badge generators (idempotent by design)
    await call("admin_run_monthly_attendance_badges", {
      p_year: year,
      p_month: month,
    });

    await call("admin_run_monthly_creator_attendance_badges", {
      p_year: year,
      p_month: month,
    });

    await call("admin_run_monthly_creator_follower_badges", {
      p_year: year,
      p_month: month,
    });

    await call("admin_run_monthly_creator_revenue_badges", {
      p_year: year,
      p_month: month,
    });

    await call("admin_run_monthly_participant_growth_badges", {
      p_year: year,
      p_month: month,
    });

    // 2) Build & send digests for that same period
    await call("admin_generate_monthly_badge_digest", {
      p_period: period,
    });

    const allOk = steps.every((s) => s.ok);

    return json({
      ok: allOk,
      period,
      year,
      month,
      steps,
    }, allOk ? 200 : 500);
  } catch (e) {
    return json(
      { ok: false, error: String(e ?? "unknown error") },
      500,
    );
  }
});