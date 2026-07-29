// supabase/functions/email_send_receipt/index.ts
// Service-only sender for transactional receipts.
// Pulls one pending row from app_email_outbox (kind='receipt'), sends it, marks sent_at.
// If RESEND_API_KEY missing, it logs-only (dev-safe).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM      = Deno.env.get("RESEND_FROM") || "no-reply@example.com";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type OutboxRow = {
  id: number;
  kind: "receipt";
  tx_id: string;
  to_email: string;
  subject: string;
  html_body: string;
  text_body: string;
  attempt_count: number;
};

Deno.serve(async (_req) => {
  try {
    // 1) claim one pending email, atomically.
    // Delegated to app_claim_email(), which uses FOR UPDATE SKIP LOCKED so a
    // row is claimed exactly once even if two invocations overlap, and bumps
    // attempt_count in the same statement. The previous inline version wrote
    // NULL into attempt_count (NOT NULL) as a placeholder, which Postgres
    // rejected, and claimed in two non-atomic steps.
    const { data: job, error: claimErr } = await admin
      .rpc("app_claim_email", { p_kind: "receipt" })
      .maybeSingle<OutboxRow>();

    if (claimErr) throw new Error(`claim failed: ${claimErr.message}`);
    if (!job) {
      return json({ ok: true, picked: 0, note: "no pending" }, 200);
    }

    // 2) send
    if (!RESEND_API_KEY) {
      console.log("[DEV] would send", {
        to: job.to_email,
        subject: job.subject,
        preview: job.text_body.slice(0, 120) + "...",
      });
      await markSent(job.id);
      return json({ ok: true, picked: 1, sent: true, mode: "log-only" });
    }

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [job.to_email],
        subject: job.subject,
        html: job.html_body,
        text: job.text_body,
      }),
    });

    if (!sendRes.ok) {
      const msg = await sendRes.text();
      await markError(job.id, msg);
      return json({ ok: false, picked: 1, sent: false, error: msg }, 502);
    }

    await markSent(job.id);
    return json({ ok: true, picked: 1, sent: true, mode: "resend" });
  } catch (e) {
    console.error("email_send_receipt failed", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

async function markSent(id: number) {
  const { error } = await admin
    .from("app_email_outbox")
    .update({ sent_at: new Date().toISOString(), last_error: null })
    .eq("id", id);
  if (error) throw new Error(`markSent failed: ${error.message}`);
}

async function markError(id: number, err: string) {
  const { error } = await admin
    .from("app_email_outbox")
    .update({ last_error: err })
    .eq("id", id);
  if (error) throw new Error(`markError failed: ${error.message}`);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}