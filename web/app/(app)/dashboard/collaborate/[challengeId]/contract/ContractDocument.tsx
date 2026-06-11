import type { ReactNode } from "react";

const INK = "#0F2229";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";

/** Frozen contract snapshot shape (app_collaboration_contract.snapshot_json). */
export type ContractSnapshot = {
  contract_type?: string;
  target?: { id: string; title: string };
  parties?: Array<{
    role: string;
    type: string;
    legal_name: string | null;
    profile_id: string;
    entity_name: string | null;
  }>;
  revenue_shares?: Array<{ profile_id: string; share_percent: number }>;
  economics?: { currency: string; price_cents: number };
  schedule?: {
    start_date: string | null;
    end_date: string | null;
    sessions?: Array<{
      id: string;
      title: string;
      starts_at: string;
      duration_minutes: number;
      host_profile_id: string | null;
      cohost_profile_ids: string[];
    }>;
  };
  signatures?: Array<{ profile_id: string; signer_name: string | null }>;
  audit?: { version: number; locked_at: string; locked_by: string };
};

function fmtDate(iso: string | null | undefined, tz?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    return "—";
  }
}

function fmtDateTime(iso: string | null | undefined, tz?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    return "—";
  }
}

function chf(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em] font-headline mb-3"
        style={{ color: FAINT }}
      >
        {label}
      </p>
      {children}
    </section>
  );
}

/**
 * Read-only render of a LOCKED collaboration contract, straight from the
 * frozen snapshot (legal names, revenue split, signatures, schedule, hash).
 * The pre-publish workspace IS the contract review surface, but it's gone
 * after publish — this is the durable single source of truth thereafter.
 */
export function ContractDocument({
  snapshot,
  version,
  lockedAt,
  sha256,
  rawText,
  timeZone,
}: {
  snapshot: ContractSnapshot;
  version: number;
  lockedAt: string;
  sha256: string | null;
  rawText: string | null;
  timeZone?: string;
}) {
  const parties = snapshot.parties ?? [];
  const shareById = new Map<string, number>(
    (snapshot.revenue_shares ?? []).map((r) => [r.profile_id, r.share_percent])
  );
  const signedIds = new Set(
    (snapshot.signatures ?? []).map((s) => s.profile_id)
  );
  const nameById = new Map<string, string>(
    parties.map((p) => [p.profile_id, p.legal_name ?? "—"])
  );

  const title = snapshot.target?.title ?? "Collaboration";
  const currency = snapshot.economics?.currency ?? "CHF";
  const priceCents = snapshot.economics?.price_cents ?? 0;
  const startDate = snapshot.schedule?.start_date;
  const endDate = snapshot.schedule?.end_date;
  const sessions = snapshot.schedule?.sessions ?? [];
  const lockedByName = snapshot.audit?.locked_by
    ? nameById.get(snapshot.audit.locked_by) ?? null
    : null;
  const shortHash = sha256 ? sha256.slice(0, 12) : null;

  return (
    <div
      className="rounded-3xl p-6 sm:p-9"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 10px 30px rgba(15,34,41,0.06)",
      }}
    >
      {/* Header */}
      <p
        className="text-[11px] font-bold uppercase tracking-[0.2em] font-headline mb-2"
        style={{ color: CYAN }}
      >
        Collaboration contract
      </p>
      <h1
        className="text-2xl sm:text-3xl font-black font-headline tracking-tight"
        style={{ color: INK }}
      >
        {title}
      </h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold font-headline px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(21,128,61,0.10)", color: "#15803d" }}
        >
          ✓ Verified record
        </span>
        <span className="text-xs" style={{ color: MUTED }}>
          Version {version} · Locked {fmtDate(lockedAt, timeZone)}
        </span>
      </div>

      {/* Parties & revenue */}
      <Section label="Parties & revenue split">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(15,34,41,0.08)" }}
        >
          {parties.map((p, i) => {
            const share = shareById.get(p.profile_id);
            const signed = signedIds.has(p.profile_id);
            return (
              <div
                key={p.profile_id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{
                  borderTop: i === 0 ? undefined : "1px solid rgba(15,34,41,0.06)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black font-headline truncate" style={{ color: INK }}>
                    {p.legal_name ?? "—"}
                  </p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider font-headline mt-0.5"
                    style={{ color: p.role === "host" ? ORANGE : CYAN }}
                  >
                    {p.role === "host" ? "Owner / Host" : "Co-host"}
                    {p.entity_name ? ` · ${p.entity_name}` : ""}
                  </p>
                </div>
                {signed && (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold font-headline px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(21,128,61,0.10)", color: "#15803d" }}
                  >
                    ✓ Signed
                  </span>
                )}
                <p
                  className="text-lg font-black font-headline tabular-nums shrink-0 w-14 text-right"
                  style={{ color: INK }}
                >
                  {share != null ? `${share}%` : "—"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] mt-2" style={{ color: FAINT }}>
          Share of creator earnings, after the platform fee. See Earnings for
          per-sale figures.
        </p>
      </Section>

      {/* Terms */}
      <Section label="Terms">
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "rgba(15,34,41,0.025)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider font-headline" style={{ color: FAINT }}>
              Price
            </p>
            <p className="text-base font-black font-headline mt-1" style={{ color: INK }}>
              {chf(priceCents, currency)}
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "rgba(15,34,41,0.025)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider font-headline" style={{ color: FAINT }}>
              Dates
            </p>
            <p className="text-base font-black font-headline mt-1" style={{ color: INK }}>
              {fmtDate(startDate, timeZone)} – {fmtDate(endDate, timeZone)}
            </p>
          </div>
        </div>
      </Section>

      {/* Schedule */}
      {sessions.length > 0 && (
        <Section label={`Schedule · ${sessions.length} sessions`}>
          <details className="group">
            <summary
              className="cursor-pointer list-none flex items-center gap-2 text-sm font-bold font-headline select-none"
              style={{ color: CYAN }}
            >
              <span className="transition-transform group-open:rotate-90">▸</span>
              Show all sessions
            </summary>
            <div
              className="mt-3 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(15,34,41,0.08)" }}
            >
              {sessions.map((s, i) => {
                const host = s.host_profile_id ? nameById.get(s.host_profile_id) : null;
                const cohosts = (s.cohost_profile_ids ?? [])
                  .map((id) => nameById.get(id))
                  .filter(Boolean) as string[];
                const who = [host, ...cohosts].filter(Boolean).join(" & ");
                return (
                  <div
                    key={s.id}
                    className="px-4 py-3"
                    style={{ borderTop: i === 0 ? undefined : "1px solid rgba(15,34,41,0.06)" }}
                  >
                    <p className="text-sm font-bold font-headline" style={{ color: INK }}>
                      {s.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                      {fmtDateTime(s.starts_at, timeZone)} · {s.duration_minutes} min
                      {who ? ` · ${who}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </details>
        </Section>
      )}

      {/* Integrity / record */}
      <Section label="Record">
        <div
          className="rounded-2xl px-4 py-4 text-xs leading-relaxed"
          style={{ backgroundColor: "rgba(15,34,41,0.025)", color: MUTED }}
        >
          <p>
            Locked {fmtDateTime(lockedAt, timeZone)}
            {lockedByName ? ` by ${lockedByName}` : ""} · Version {version}
          </p>
          {sha256 && (
            <p className="mt-1 break-all">
              <span style={{ color: FAINT }}>SHA-256:</span> {sha256}
            </p>
          )}
          {rawText && (
            <details className="mt-3">
              <summary
                className="cursor-pointer list-none font-bold font-headline"
                style={{ color: CYAN }}
              >
                View raw record
              </summary>
              <pre
                className="mt-2 whitespace-pre-wrap break-words text-[11px] p-3 rounded-xl"
                style={{ backgroundColor: "rgba(15,34,41,0.04)", color: INK }}
              >
                {rawText}
              </pre>
            </details>
          )}
        </div>
        <p className="text-[11px] mt-2" style={{ color: FAINT }}>
          This is the agreement as locked at publish — the single source of truth
          for this collaboration.
        </p>
      </Section>
    </div>
  );
}
