import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — INFITRA" };

/**
 * /admin — founder-only operations board. Functionality over design on
 * purpose (founder call, 16 Aug).
 *
 * The gate here is COSMETIC: non-admins get a 404 so the page does not
 * exist for them, but the real enforcement lives in the admin_* RPCs,
 * every one of which asserts is_admin(auth.uid()) SERVER-SIDE inside
 * SECURITY DEFINER. Rendering this page without the flag yields nothing.
 */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: me } = await supabase
    .from("app_profile")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) notFound();

  const [pulse, money, payouts, people, applications, experiences, log] =
    await Promise.all([
      supabase.rpc("admin_pulse"),
      supabase.rpc("admin_money"),
      supabase.rpc("admin_payouts"),
      supabase.rpc("admin_people", { p_query: null, p_limit: 200 }),
      supabase.rpc("admin_applications"),
      supabase.rpc("admin_experiences"),
      supabase.rpc("admin_action_log", { p_limit: 100 }),
    ]);

  const firstError =
    pulse.error || money.error || payouts.error || people.error ||
    applications.error || experiences.error || log.error;
  if (firstError) {
    // The RPCs raise not_admin (42501) if the flag was pulled mid-session.
    if (String(firstError.message || "").includes("not_admin")) notFound();
    throw new Error(`Admin board load failed: ${firstError.message}`);
  }

  return (
    <AdminShell
      pulse={pulse.data}
      money={money.data}
      payouts={payouts.data}
      people={people.data}
      applications={applications.data}
      experiences={experiences.data}
      log={log.data}
    />
  );
}
