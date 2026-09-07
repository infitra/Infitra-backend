import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { signOut } from "@/app/actions/auth";
import { WorkspaceEntryForm } from "./WorkspaceEntryForm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("role, display_name, workspace_enabled")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator" && profile?.role !== "admin") {
    // Pilot: participants have no dashboard; send to landing.
    redirect("/");
  }

  // Accounts-lite (6 Sep 2026): a founding-network account has no
  // workspace until the founder flips the flag in the anchor conversation.
  // Its home is the network page.
  if (!profile.workspace_enabled) redirect("/network");

  // The signing identity used to be collected at onboarding. It now arrives
  // on the first workspace visit, once, so nothing binding is asked before
  // someone actually builds. Every contract from here on renders with it.
  const { data: identity } = await supabase
    .from("app_creator_contract_identity")
    .select("creator_id, authority_attested")
    .eq("creator_id", user.id)
    .maybeSingle();
  const needsAttestation = !identity?.authority_attested;

  if (needsAttestation) {
    // The one binding step is a room with one door: no app nav, only the
    // logo and sign out. Every /dashboard route lands here until it is done.
    return (
      <div className="min-h-screen">
        <div className="px-6 pt-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link href="/network" className="flex items-center gap-2.5">
              <Image src="/logo-mark.png" alt="INFITRA" width={34} height={34} className="block rounded-lg" />
              <span
                className="text-[22px] tracking-tight font-headline leading-none"
                style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                INFITRA
              </span>
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-full font-headline cursor-pointer hover:opacity-80"
                style={{
                  color: "rgba(15, 34, 41, 0.50)",
                  border: "1px solid rgba(15, 34, 41, 0.12)",
                  backgroundColor: "rgba(255, 255, 255, 0.35)",
                }}
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
        <div className="px-6">
          <WorkspaceEntryForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Unified app nav (creator variant) — single source of truth, shared
          with every participant surface. */}
      <ParticipantNav
        displayName={profile?.display_name ?? null}
        role={profile?.role}
        workspaceEnabled={profile.workspace_enabled}
      />

      {/* Content */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
