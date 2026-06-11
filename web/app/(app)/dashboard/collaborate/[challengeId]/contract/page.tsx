import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ContractDocument, type ContractSnapshot } from "./ContractDocument";
import { resolveViewerTimeZone } from "@/lib/time/viewerTimeZone";

export const metadata = { title: "Collaboration Contract — INFITRA" };
export const dynamic = "force-dynamic";

/**
 * Post-publish read-only contract view. The workspace (the pre-publish contract
 * review surface) is locked away after publish, so this is the durable place a
 * party returns to for the agreed terms. Owner + co-hosts only — it carries
 * revenue splits and legal names (RLS on app_collaboration_contract enforces
 * the same; the explicit gate here just yields a clean redirect).
 */
export default async function ContractPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("id, title, owner_id, contract_id")
    .eq("id", challengeId)
    .maybeSingle();
  if (!challenge) redirect("/dashboard");

  const isOwner = challenge.owner_id === user.id;
  let isCohost = false;
  if (!isOwner) {
    const { data: ch } = await supabase
      .from("app_challenge_cohost")
      .select("cohost_id")
      .eq("challenge_id", challengeId)
      .eq("cohost_id", user.id)
      .maybeSingle();
    isCohost = !!ch;
  }
  if (!isOwner && !isCohost) redirect("/dashboard");

  // No locked contract (e.g. a solo experience that never went through the
  // collaboration lock) — nothing to show; send back to the workspace.
  if (!challenge.contract_id) {
    redirect(`/dashboard/collaborate/${challengeId}`);
  }

  const { data: contract } = await supabase
    .from("app_collaboration_contract")
    .select("version, locked_at, sha256, snapshot_json, snapshot_text")
    .eq("id", challenge.contract_id)
    .maybeSingle();
  if (!contract || !contract.snapshot_json) redirect("/dashboard");

  const viewerTimeZone = await resolveViewerTimeZone();

  return (
    <div className="py-8 max-w-3xl mx-auto px-4">
      <Link
        href="/dashboard"
        className="text-xs font-bold font-headline inline-block mb-5 hover:underline"
        style={{ color: "#94a3b8" }}
      >
        ← Back to dashboard
      </Link>
      <ContractDocument
        snapshot={contract.snapshot_json as ContractSnapshot}
        version={Number(contract.version)}
        lockedAt={contract.locked_at as string}
        sha256={(contract.sha256 as string | null) ?? null}
        rawText={(contract.snapshot_text as string | null) ?? null}
        timeZone={viewerTimeZone}
      />
    </div>
  );
}
