import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";
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
        <div className="max-w-7xl mx-auto">
          {needsAttestation ? <WorkspaceEntryForm /> : children}
        </div>
      </div>
    </div>
  );
}
