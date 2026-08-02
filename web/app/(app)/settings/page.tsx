import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VisibilityToggle } from "./VisibilityToggle";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account settings — INFITRA" };

/**
 * /settings — one account surface for BOTH roles.
 *
 *   PROFILE VISIBILITY — moved off the profile editor (it is an account
 *   decision, not a profile field) with the honest encouragement to stay
 *   public: only what you chose to fill in plus your INFITRA activity is
 *   shared, and the product runs on people being visible to each other.
 *
 *   MY AGREEMENTS — every recorded collaboration agreement the caller is a
 *   party to, in one place. Previously reachable only from an experience
 *   card, which mixed a governance artifact into an operational CTA.
 *
 * Wording note: the product says AGREEMENT, not contract. Same recorded
 * artifact, same value, without implying a fully-executed legal contract.
 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, role, visibility")
    .eq("id", user.id)
    .maybeSingle();

  const isCreator = profile?.role === "creator";

  // Agreements: experiences the caller owns or co-hosts that carry a locked
  // agreement. Participants have none — the section simply doesn't render.
  const [{ data: owned }, { data: cohosted }] = await Promise.all([
    supabase
      .from("app_challenge")
      .select("id, title, contract_id, status, start_date")
      .eq("owner_id", user.id)
      .not("contract_id", "is", null),
    supabase
      .from("app_challenge_cohost")
      .select("app_challenge(id, title, contract_id, status, start_date)")
      .eq("cohost_id", user.id),
  ]);

  type Row = { id: string; title: string | null; contract_id: string | null; status: string; start_date: string | null };
  const byId = new Map<string, Row>();
  for (const c of (owned ?? []) as Row[]) byId.set(c.id, c);
  for (const link of (cohosted ?? []) as Array<{ app_challenge: Row | Row[] | null }>) {
    const c = Array.isArray(link.app_challenge) ? link.app_challenge[0] : link.app_challenge;
    if (c?.contract_id) byId.set(c.id, c);
  }
  const agreements = [...byId.values()].sort((a, b) =>
    (b.start_date ?? "").localeCompare(a.start_date ?? ""),
  );

  return (
    <div className="pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href={isCreator ? "/dashboard" : "/me"}
          className="text-xs font-bold font-headline inline-block mb-5 hover:underline"
          style={{ color: "#94a3b8" }}
        >
          ← Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#FF6130" }} />
          <h1
            className="text-3xl md:text-4xl font-headline tracking-tight"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Account settings
          </h1>
        </div>

        <section
          className="rounded-2xl p-5 mb-5"
          style={{ backgroundColor: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,34,41,0.08)" }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.2em] font-headline mb-1"
            style={{ color: "#475569", fontWeight: 700 }}
          >
            Profile visibility
          </p>
          <VisibilityToggle initial={(profile?.visibility as string) ?? "public"} />
        </section>

        {agreements.length > 0 && (
          <section
            className="rounded-2xl p-5"
            style={{ backgroundColor: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,34,41,0.08)" }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-headline mb-1"
              style={{ color: "#475569", fontWeight: 700 }}
            >
              My agreements
            </p>
            <p className="text-[12px] mb-4" style={{ color: "#64748b" }}>
              Every collaboration agreement you are part of, recorded at the
              moment it was locked. Open one to read or export it.
            </p>
            <ul className="space-y-2">
              {agreements.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/dashboard/collaborate/${a.id}/contract`}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(15,34,41,0.08)" }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-black font-headline truncate" style={{ color: "#0F2229" }}>
                        {a.title || "Untitled experience"}
                      </span>
                      <span className="block text-[11px]" style={{ color: "#94a3b8" }}>
                        {a.start_date ? `Starts ${a.start_date}` : "Draft"} · {a.status}
                      </span>
                    </span>
                    <span className="text-[11px] font-black font-headline shrink-0" style={{ color: "#0891b2" }}>
                      Open →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
