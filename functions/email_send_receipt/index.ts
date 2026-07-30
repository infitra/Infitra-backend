// supabase/functions/email_send_receipt/index.ts
// Service-only sender for transactional receipts.
// Drains pending app_email_outbox rows (kind='receipt') via Resend, marking
// each sent_at. Invoked every minute by the app_drain_email_outbox cron job.
// If RESEND_API_KEY is missing it logs-only (dev-safe).
//
// Rows that keep failing are retired by app_claim_email() after
// MAX_EMAIL_ATTEMPTS tries, so a hard-bouncing address cannot be retried
// every minute forever. Inspect them with:
//   select * from app_email_outbox where sent_at is null and attempt_count >= 5;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM      = Deno.env.get("RESEND_FROM") || "no-reply@example.com";
// Explicit reply address. Without it a reply follows whatever From happens to
// be, which silently changes if the sending identity is ever reconfigured.
// The receipt tells buyers "just reply to this email", so this must land in a
// mailbox a human reads.
const RESEND_REPLY_TO  = Deno.env.get("RESEND_REPLY_TO") || "hello@infitra.fit";

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

// Drain the whole queue per invocation, not one email. The scheduler runs
// this every minute; sending one per run would mean a burst of purchases
// trickles out at one receipt per minute. MAX_BATCH bounds the run so a
// large backlog can't exceed the function's wall-clock limit; whatever is
// left is picked up by the next tick.
const MAX_BATCH = 20;

Deno.serve(async (_req) => {
  const result = { picked: 0, sent: 0, failed: 0, mode: RESEND_API_KEY ? "resend" : "log-only" };

  try {
    while (result.picked < MAX_BATCH) {
      // Claim one pending email, atomically. app_claim_email() uses FOR
      // UPDATE SKIP LOCKED so a row is claimed exactly once even if two
      // invocations overlap, and bumps attempt_count in the same statement.
      // It returns SETOF, so an empty queue yields null rather than a row of
      // NULLs (which would be truthy here).
      const { data: job, error: claimErr } = await admin
        .rpc("app_claim_email", { p_kind: "receipt" })
        .maybeSingle<OutboxRow>();

      if (claimErr) throw new Error(`claim failed: ${claimErr.message}`);
      if (!job) break;

      result.picked++;

      if (!RESEND_API_KEY) {
        console.log("[DEV] would send", { to: job.to_email, subject: job.subject });
        await markSent(job.id);
        result.sent++;
        continue;
      }

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          reply_to: RESEND_REPLY_TO,
          to: [job.to_email],
          subject: job.subject,
          html: job.html_body,
          text: job.text_body,
        }),
      });

      if (!sendRes.ok) {
        // Record and move on rather than aborting: one bad address must not
        // block every other receipt behind it in the queue.
        const msg = await sendRes.text();
        console.error(`send failed for outbox ${job.id}: ${msg}`);
        await markError(job.id, msg);
        result.failed++;
        continue;
      }

      await markSent(job.id);
      result.sent++;
    }

    return json({ ok: result.failed === 0, ...result }, 200);
  } catch (e) {
    console.error("email_send_receipt failed", e);
    return json({ ok: false, ...result, error: String(e) }, 500);
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