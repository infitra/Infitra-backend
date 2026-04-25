import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Collaboration Contract — INFITRA" };

/**
 * Read-only contract document for a published (or locked) collaboration.
 *
 * Renders directly from `app_collaboration_contract.snapshot_json` — the
 * frozen, hashed snapshot taken when the contract was locked. This is the
 * source of truth for "what everyone signed", and never mutates after lock.
 *
 * Access: only owner + cohosts of the underlying challenge. Other authed
 * users get redirected to /dashboard.
 *
 * Linked from:
 *   - `WorkspaceEditor` (the workspace itself surfaces a "View signed
 *     contract" link once a contract row exists — both during the locked
 *     review state and after publish).
 */

interface SnapshotParty {
  role: "host" | "cohost";
  type: string;
  legal_name: string | null;
  profile_id: string;
  entity_name: string | null;
}

interface SnapshotSession {
  id: string;
  title: string;
  starts_at: string;
  host_profile_id: string;
  duration_minutes: number;
  cohost_profile_ids: string[];
}

interface SnapshotShare {
  profile_id: string;
  share_percent: number;
}

interface SnapshotSignature {
  profile_id: string;
  signer_name: string;
}

interface ContractSnapshot {
  audit: { version: number; locked_at: string; locked_by: string };
  target: { id: string; title: string };
  parties: SnapshotParty[];
  schedule: {
    start_date: string | null;
    end_date: string | null;
    sessions: SnapshotSession[];
  };
  economics: { currency: string; price_cents: number };
  signatures: SnapshotSignature[];
  contract_type: string;
  revenue_shares: SnapshotShare[];
  schema_version: number;
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency: currency || "CHF",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default async function ContractPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the challenge (RLS gates access — we only see it if owner/cohost)
  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("id, title, status, owner_id, contract_id")
    .eq("id", challengeId)
    .single();

  if (!challenge) notFound();
  if (!challenge.contract_id) {
    // No contract yet (challenge never reached the locked state)
    redirect(`/dashboard/collaborate/${challengeId}`);
  }

  // Verify membership explicitly so we can return a clean 404 rather than
  // relying on RLS to silently empty the result.
  const isOwner = challenge.owner_id === user.id;
  const { data: cohostCheck } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id")
    .eq("challenge_id", challengeId)
    .eq("cohost_id", user.id)
    .maybeSingle();
  const isCohost = !!cohostCheck;
  if (!isOwner && !isCohost) redirect("/dashboard");

  // Fetch the locked snapshot
  const { data: contract } = await supabase
    .from("app_collaboration_contract")
    .select("id, locked_at, snapshot_json, snapshot_text, sha256, version")
    .eq("id", challenge.contract_id)
    .single();

  if (!contract) notFound();

  const snap = contract.snapshot_json as unknown as ContractSnapshot;

  // Fetch acceptances (who actually signed) — the snapshot lists
  // signatories but the acceptance table holds the timestamps.
  const { data: acceptanceRows } = await supabase
    .from("app_collaboration_acceptance")
    .select("cohost_id, accepted_at")
    .eq("contract_id", contract.id);

  const acceptanceMap: Record<string, string | null> = {};
  for (const row of acceptanceRows ?? []) {
    acceptanceMap[(row as any).cohost_id] = (row as any).accepted_at ?? null;
  }

  // Map profile_id → display info for friendlier rendering than UUIDs
  const partyIds = [...new Set(snap.parties.map((p) => p.profile_id))];
  const { data: profiles } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url")
    .in("id", partyIds);
  const profileMap: Record<string, { name: string; avatar: string | null }> = {};
  for (const p of profiles ?? []) {
    profileMap[(p as any).id] = {
      name: (p as any).display_name ?? "Creator",
      avatar: (p as any).avatar_url ?? null,
    };
  }

  // Compute owner share = 100% − sum(cohost shares). The owner doesn't
  // appear in revenue_shares (that's by design — they hold the residual).
  const ownerProfileId = snap.parties.find((p) => p.role === "host")?.profile_id ?? challenge.owner_id;
  const cohostSharesTotal = snap.revenue_shares
    .filter((s) => s.profile_id !== ownerProfileId)
    .reduce((acc, s) => acc + (s.share_percent ?? 0), 0);
  const ownerShare = 100 - cohostSharesTotal;

  // Reading the share for a given profile (owner gets the residual)
  function shareFor(profileId: string): number {
    if (profileId === ownerProfileId) return ownerShare;
    const found = snap.revenue_shares.find((s) => s.profile_id === profileId);
    return found?.share_percent ?? 0;
  }

  const isPublished = challenge.status === "published";
  const isLocked = challenge.status === "draft";

  return (
    <div className="py-6 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href={`/dashboard/collaborate/${challengeId}`}
        className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] mb-4 inline-block"
      >
        ← Back to Workspace
      </Link>

      {/* Document */}
      <article
        className="rounded-3xl overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(15,34,41,0.08)",
          boxShadow: "0 12px 40px rgba(15,34,41,0.06)",
        }}
      >
        {/* Header — document-style, calm */}
        <header
          className="px-8 py-7"
          style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] font-headline text-[#94a3b8] font-bold mb-2">
                Collaboration Contract
              </p>
              <h1 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight">
                {snap.target.title}
              </h1>
              <p className="text-xs text-[#94a3b8] mt-2">
                Version {contract.version ?? snap.audit.version} · Locked {formatDateTime(snap.audit.locked_at)}
              </p>
            </div>
            <span
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black font-headline"
              style={
                isPublished
                  ? { backgroundColor: "rgba(21,128,61,0.10)", color: "#15803d" }
                  : { backgroundColor: "rgba(8,145,178,0.10)", color: "#0891b2" }
              }
            >
              {isPublished ? "✓ Signed & Published" : isLocked ? "Under Review" : "Locked"}
            </span>
          </div>
        </header>

        {/* Parties */}
        <Section title="Parties">
          <div className="space-y-3">
            {snap.parties.map((party) => {
              const prof = profileMap[party.profile_id];
              return (
                <div
                  key={party.profile_id}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ backgroundColor: "rgba(15,34,41,0.025)" }}
                >
                  {prof?.avatar ? (
                    <img
                      src={prof.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-cyan-100">
                      <span className="text-sm font-black text-cyan-700">
                        {prof?.name?.[0] ?? "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black font-headline text-[#0F2229] truncate">
                      {party.legal_name ?? prof?.name ?? "Creator"}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest font-bold font-headline text-[#94a3b8]">
                      {party.role === "host" ? "Owner" : "Cohost"}
                      {party.entity_name ? ` · ${party.entity_name}` : ""}
                    </p>
                  </div>
                  <p
                    className="shrink-0 text-base font-black font-headline"
                    style={{ color: party.role === "host" ? "#FF6130" : "#0891b2" }}
                  >
                    {shareFor(party.profile_id)}%
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-3">
            Revenue shares apply to the creator share (80% gross, after the 20% INFITRA platform fee).
          </p>
        </Section>

        {/* Economics */}
        <Section title="Economics">
          <div className="grid grid-cols-2 gap-3">
            <Fact label="Price">{formatMoney(snap.economics.price_cents, snap.economics.currency)}</Fact>
            <Fact label="Currency">{snap.economics.currency}</Fact>
            <Fact label="Platform fee">20% (gross)</Fact>
            <Fact label="Creator share">80% (split per Parties)</Fact>
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Fact label="Start date">{formatDate(snap.schedule.start_date)}</Fact>
            <Fact label="End date">{formatDate(snap.schedule.end_date)}</Fact>
            <Fact label="Sessions">{snap.schedule.sessions.length}</Fact>
            <Fact label="Type">{snap.contract_type}</Fact>
          </div>

          <div className="space-y-2">
            {snap.schedule.sessions.map((s, i) => {
              const host = profileMap[s.host_profile_id];
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ border: "1px solid rgba(15,34,41,0.08)" }}
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold font-headline text-[#94a3b8] shrink-0 w-6 text-center">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black font-headline text-[#0F2229] truncate">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-[#94a3b8]">
                      {formatDateTime(s.starts_at)} · {s.duration_minutes} min · Host: {host?.name ?? "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Signatures */}
        <Section title="Signatures">
          <div className="space-y-2">
            {/* Owner first — they trigger publish, treated as signed at lock */}
            {(() => {
              const ownerSig = snap.signatures.find((s) => s.profile_id === ownerProfileId);
              const ownerProf = profileMap[ownerProfileId];
              return (
                <SignatureRow
                  name={ownerSig?.signer_name ?? ownerProf?.name ?? "Owner"}
                  role="Owner"
                  signedAt={snap.audit.locked_at}
                  avatar={ownerProf?.avatar ?? null}
                />
              );
            })()}
            {snap.signatures
              .filter((s) => s.profile_id !== ownerProfileId)
              .map((sig) => {
                const prof = profileMap[sig.profile_id];
                return (
                  <SignatureRow
                    key={sig.profile_id}
                    name={sig.signer_name ?? prof?.name ?? "Cohost"}
                    role="Cohost"
                    signedAt={acceptanceMap[sig.profile_id] ?? null}
                    avatar={prof?.avatar ?? null}
                  />
                );
              })}
          </div>
        </Section>

        {/* Integrity footer */}
        <footer
          className="px-8 py-5 text-[11px] text-[#94a3b8] leading-relaxed"
          style={{
            backgroundColor: "rgba(15,34,41,0.025)",
            borderTop: "1px solid rgba(15,34,41,0.06)",
          }}
        >
          <p className="mb-1">
            This snapshot was frozen at lock time and cannot be modified. Any change to terms after
            this point requires a new contract version, which resets all signatures.
          </p>
          {contract.sha256 && (
            <p className="font-mono text-[10px] break-all">
              Integrity hash · sha256: {contract.sha256}
            </p>
          )}
        </footer>
      </article>
    </div>
  );
}

// ─── Small presentational helpers ────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="px-8 py-6"
      style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}
    >
      <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold font-headline text-[#94a3b8] mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ backgroundColor: "rgba(15,34,41,0.025)" }}
    >
      <p className="text-[10px] uppercase tracking-widest font-bold font-headline text-[#94a3b8] mb-1">
        {label}
      </p>
      <p className="text-sm font-black font-headline text-[#0F2229]">{children}</p>
    </div>
  );
}

function SignatureRow({
  name,
  role,
  signedAt,
  avatar,
}: {
  name: string;
  role: string;
  signedAt: string | null;
  avatar: string | null;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: "rgba(21,128,61,0.04)", border: "1px solid rgba(21,128,61,0.15)" }}
    >
      {avatar ? (
        <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-cyan-100">
          <span className="text-xs font-black text-cyan-700">{name[0] ?? "?"}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black font-headline text-[#0F2229] truncate">{name}</p>
        <p className="text-[10px] uppercase tracking-widest font-bold font-headline text-[#94a3b8]">
          {role}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className="inline-flex items-center gap-1 text-[11px] font-black font-headline"
          style={{ color: "#15803d" }}
        >
          ✓ Signed
        </p>
        {signedAt && (
          <p className="text-[10px] text-[#94a3b8] mt-0.5">{formatDateTime(signedAt)}</p>
        )}
      </div>
    </div>
  );
}
