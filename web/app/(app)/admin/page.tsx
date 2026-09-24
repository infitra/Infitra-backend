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

  const [pulse, money, payouts, people, applications, experiences, log, invites] =
    await Promise.all([
      supabase.rpc("admin_pulse"),
      supabase.rpc("admin_money"),
      supabase.rpc("admin_payouts"),
      supabase.rpc("admin_people", { p_query: null, p_limit: 200 }),
      supabase.rpc("admin_applications"),
      supabase.rpc("admin_experiences"),
      supabase.rpc("admin_action_log", { p_limit: 100 }),
      supabase.rpc("admin_creator_invites"),
    ]);

  // Name every load, so a failure says WHICH one rather than throwing a
  // digest (24 Sep 2026: a generic boundary cost a debugging session).
  const loads = { pulse, money, payouts, people, applications, experiences, log, invites };
  const failed = Object.entries(loads)
    .filter(([, r]) => r.error)
    .map(([rpc, r]) => ({ rpc, message: r.error!.message, code: (r.error as { code?: string }).code }));

  if (failed.length > 0) {
    // The RPCs raise not_admin (42501) if the flag was pulled mid-session.
    if (failed.some((f) => String(f.message || "").includes("not_admin"))) notFound();
    return <LoadFailure failed={failed} />;
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
      invites={invites.data}
    />
  );
}

/** Founder-only page: say exactly which load failed and why. */
function LoadFailure({ failed }: { failed: Array<{ rpc: string; message: string; code?: string }> }) {
  return (
    <div className="min-h-screen px-4 py-10 md:px-8" style={{ backgroundColor: "#F2EFE8", color: "#0F2229" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-headline mb-2" style={{ fontWeight: 700 }}>
          Admin board load failed
        </h1>
        <p className="text-sm mb-5" style={{ color: "#475569" }}>
          {failed.length} of 8 loads returned an error. Everything else is fine.
        </p>
        {failed.map((f) => (
          <pre
            key={f.rpc}
            className="text-xs whitespace-pre-wrap break-all rounded-xl p-4 mb-3"
            style={{ backgroundColor: "rgba(180,35,24,0.06)", border: "1px solid rgba(180,35,24,0.20)", color: "#b42318" }}
          >
            {f.rpc}{f.code ? ` · ${f.code}` : ""}\n{f.message}
          </pre>
        ))}
        <a
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-full text-sm font-headline"
          style={{ border: "1px solid rgba(15,34,41,0.15)", fontWeight: 600 }}
        >
          Back to workspace
        </a>
      </div>
    </div>
  );
}
