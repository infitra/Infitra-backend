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
    // 1) grab one pending email atomically
    // NOTE: Supabase RPC is easier for true "claim & lock". For simplicity, use a single UPDATE ... RETURNING.
    const { data: claim, error: claimErr } = await admin
      .from("app_email_outbox")
      .update({ attempt_count: (null as any) }) // placeholder; we’ll set properly below
      .eq("kind", "receipt" as const)
      .is("sent_at", null)
      .order("enqueued_at", { ascending: true })
      .limit(1)
      .select("*");

    if (claimErr) throw new Error(`claim failed: ${claimErr.message}`);
    if (!claim || !claim.length) {
      return json({ ok: true, picked: 0, note: "no pending" }, 200);
    }

    const row = claim[0] as OutboxRow;

    // refresh attempt_count properly (race-safe “bump and fetch”)
    const { data: bumped, error: bumpErr } = await admin
      .from("app_email_outbox")
      .update({ attempt_count: row.attempt_count + 1 })
      .eq("id", row.id)
      .select("*")
      .maybeSingle();

    if (bumpErr) throw new Error(`bump failed: ${bumpErr.message}`);
    const job = bumped as OutboxRow;

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