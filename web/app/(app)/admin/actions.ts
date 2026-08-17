"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Admin server actions — thin wrappers over the admin_* RPCs. Authorization
 * happens INSIDE each RPC (app_admin_assert), not here; these only carry the
 * caller's own session to the database and normalize the result shape.
 */

type ActionResult = { ok: boolean; error?: string; detail?: unknown };

async function callRpc(fn: string, args?: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true, detail: data ?? undefined };
}

export async function anonymizeUser(userId: string, reason: string): Promise<ActionResult> {
  return callRpc("admin_anonymize_user", { p_user: userId, p_reason: reason || null });
}

export async function setApplicationStatus(id: string, status: string): Promise<ActionResult> {
  return callRpc("admin_set_application_status", { p_id: id, p_status: status });
}

export async function regrantTx(txId: string): Promise<ActionResult> {
  return callRpc("admin_regrant_tx", { p_tx: txId });
}

export async function resendReceipt(txId: string): Promise<ActionResult> {
  return callRpc("admin_resend_receipt", { p_tx: txId });
}

export async function forceEndSession(sessionId: string): Promise<ActionResult> {
  return callRpc("admin_force_end_session", { p_session: sessionId });
}
