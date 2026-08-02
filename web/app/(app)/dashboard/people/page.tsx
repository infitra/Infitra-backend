import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ConnectionsGrid, type ConnectionRow } from "@/app/components/ConnectionsGrid";
import { ProfileModalHost } from "@/app/components/ProfileModal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your people — INFITRA" };

/**
 * /dashboard/people — the expert's relationship views (social layer
 * foundation). Two sections from the same derived graph:
 *
 *   TRIBE CONNECTIONS — every participant who has ever joined one of their
 *   experiences (the read-only seed of the CRM; outreach tooling comes only
 *   after the Phase B legal pass).
 *
 *   MY COLLABORATORS — every expert they have built an experience with.
 *
 * Derived from memberships + cohost links, so it needs no maintenance and
 * survives completion: a connection made in a finished run stays.
 */
export default async function PeoplePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("load_my_connections");
  const rows = (data ?? []) as ConnectionRow[];
  const collaborators = rows.filter((r) => r.kind === "collaborator");
  const tribe = rows.filter((r) => r.kind !== "collaborator");

  return (
    <ProfileModalHost>
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/dashboard"
            className="text-xs font-bold font-headline inline-block mb-5 hover:underline"
            style={{ color: "#94a3b8" }}
          >
            ← Back to dashboard
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#FF6130" }} />
            <h1
              className="text-3xl md:text-4xl font-headline tracking-tight"
              style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              Your people
            </h1>
          </div>
          <p className="text-base text-[#64748b] ml-[19px] max-w-xl mb-10">
            Real connections from real experiences: everyone who has trained
            with you, and every expert you have built with.
          </p>

          {collaborators.length > 0 && (
            <div className="mb-10">
              <p
                className="text-[11px] uppercase tracking-[0.22em] font-headline mb-4 px-1"
                style={{ color: "#475569", fontWeight: 700 }}
              >
                My collaborators
                <span style={{ color: "#94a3b8" }}> · {collaborators.length}</span>
              </p>
              <ConnectionsGrid rows={collaborators} />
            </div>
          )}

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em] font-headline mb-4 px-1"
              style={{ color: "#475569", fontWeight: 700 }}
            >
              Tribe connections
              <span style={{ color: "#94a3b8" }}> · {tribe.length}</span>
            </p>
            <ConnectionsGrid rows={tribe} />
          </div>
        </div>
      </div>
    </ProfileModalHost>
  );
}
