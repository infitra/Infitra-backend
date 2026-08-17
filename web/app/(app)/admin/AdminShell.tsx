"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  anonymizeUser,
  setApplicationStatus,
  regrantTx,
  resendReceipt,
  forceEndSession,
} from "./actions";

/**
 * Founder-only operations board. Plain and functional on purpose: tables,
 * numbers, buttons. All data arrives pre-loaded from the server page; every
 * action re-validates /admin so the board refreshes after each mutation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type J = any;

const INK = "#0F2229";
const MUT = "#475569";
const OK = "#0a7a4b";
const BAD = "#b42318";

const chf = (cents: number | null | undefined) =>
  cents == null ? "–" : `CHF ${(Number(cents) / 100).toFixed(2)}`;

// Device timezone on purpose (founder call): the board is read wherever
// the founder happens to be, unlike session times which pin a zone.
const dt = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-CH", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";

const TABS = ["Pulse", "Money", "Payouts", "People", "Applications", "Experiences", "Log"] as const;
type Tab = (typeof TABS)[number];

export function AdminShell(props: {
  pulse: J;
  money: J;
  payouts: J;
  people: J;
  applications: J;
  experiences: J;
  log: J;
}) {
  const [tab, setTab] = useState<Tab>("Pulse");
  const [busy, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  const run = (label: string, fn: () => Promise<{ ok: boolean; error?: string; detail?: unknown }>) => {
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      setNotice(
        res.ok
          ? `${label}: done${res.detail ? " · " + JSON.stringify(res.detail).slice(0, 200) : ""}`
          : `${label} FAILED: ${res.error}`
      );
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8" style={{ backgroundColor: "#F2EFE8", color: INK }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-5">
          <h1 className="text-2xl font-headline" style={{ fontWeight: 700 }}>
            INFITRA · Admin
          </h1>
          <span className="text-xs" style={{ color: MUT }}>
            All actions are audited. Times in your local timezone.
          </span>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3.5 py-1.5 rounded-full text-sm font-headline"
              style={{
                fontWeight: 600,
                backgroundColor: tab === t ? INK : "rgba(15,34,41,0.06)",
                color: tab === t ? "#fff" : INK,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {notice && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: notice.includes("FAILED") ? "rgba(180,35,24,0.08)" : "rgba(10,122,75,0.08)",
              color: notice.includes("FAILED") ? BAD : OK,
            }}
          >
            {notice}
          </div>
        )}
        {busy && <div className="mb-4 text-sm" style={{ color: MUT }}>Working…</div>}

        {tab === "Pulse" && <Pulse pulse={props.pulse} />}
        {tab === "Money" && <Money money={props.money} run={run} />}
        {tab === "Payouts" && <Payouts payouts={props.payouts} />}
        {tab === "People" && <People people={props.people} run={run} />}
        {tab === "Applications" && <Applications data={props.applications} run={run} />}
        {tab === "Experiences" && <Experiences data={props.experiences} run={run} />}
        {tab === "Log" && <Log log={props.log} />}
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#fff", border: "1px solid rgba(15,34,41,0.08)" }}>
      <h2 className="text-sm font-headline uppercase tracking-wider mb-3" style={{ fontWeight: 700, color: MUT }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="text-left px-2 py-1.5 whitespace-nowrap" style={{ color: MUT, fontWeight: 600, borderBottom: "1px solid rgba(15,34,41,0.12)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td className="px-2 py-2 text-sm" style={{ color: MUT }} colSpan={head.length}>Nothing here.</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(15,34,41,0.05)" }}>
              {r.map((c, j) => (
                <td key={j} className="px-2 py-1.5 align-top whitespace-nowrap">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tile({ label, value, alarm }: { label: string; value: string | number; alarm?: boolean }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ backgroundColor: alarm ? "rgba(180,35,24,0.08)" : "#fff", border: `1px solid ${alarm ? "rgba(180,35,24,0.35)" : "rgba(15,34,41,0.08)"}` }}>
      <div className="text-[11px] uppercase tracking-wider" style={{ color: alarm ? BAD : MUT, fontWeight: 600 }}>{label}</div>
      <div className="text-xl font-headline" style={{ fontWeight: 700, color: alarm ? BAD : INK }}>{value}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-xs font-headline"
      style={{ fontWeight: 600, backgroundColor: danger ? "rgba(180,35,24,0.08)" : "rgba(15,34,41,0.06)", color: danger ? BAD : INK, border: `1px solid ${danger ? "rgba(180,35,24,0.3)" : "rgba(15,34,41,0.12)"}` }}
    >
      {label}
    </button>
  );
}

/* ---------- Pulse ---------- */

function Pulse({ pulse }: { pulse: J }) {
  const o = pulse?.outbox ?? {};
  const gap = pulse?.money_gap?.missing_entitlements ?? 0;
  const receiptsMissing = pulse?.receipts_missing ?? 0;
  const receiptsHistorical = pulse?.receipts_missing_historical ?? 0;
  const counts = pulse?.counts ?? {};
  const cron: J[] = pulse?.cron ?? [];
  const edge: J[] = pulse?.edge_calls_24h ?? [];
  // Staleness is computed in the RPC against each job's OWN schedule; a flat
  // threshold here would flag every daily job every day.
  const staleCron = cron.filter((c) => c.is_stale);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Tile label="Emails failing" value={o.failing ?? 0} alarm={(o.failing ?? 0) > 0} />
        <Tile label="Emails queued" value={o.queued ?? 0} alarm={(o.queued ?? 0) > 5} />
        <Tile label="Paid, no entitlement" value={gap} alarm={gap > 0} />
        <Tile label="Receipts missing" value={receiptsMissing} alarm={receiptsMissing > 0} />
      </div>
      {receiptsHistorical > 0 && (
        <p className="text-xs mb-4" style={{ color: MUT }}>
          Context, not an alarm: {receiptsHistorical} older purchase
          {receiptsHistorical === 1 ? "" : "s"} predate the receipt pipeline
          (first receipt {dt(pulse?.receipt_era_started)}) and never had one.
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <Tile label="Participants" value={counts.participants ?? 0} />
        <Tile label="Experts" value={counts.experts ?? 0} />
        <Tile label="Signups 7d" value={counts.signups_7d ?? 0} />
        <Tile label="Live now" value={counts.live_now ?? 0} />
        <Tile label="Sessions next 7d" value={counts.sessions_upcoming_7d ?? 0} />
        <Tile label="Published experiences" value={counts.experiences_published ?? 0} />
      </div>

      <Card title={`Cron heartbeat${staleCron.length ? " · STALE JOBS" : ""}`}>
        <Table
          head={["Job", "Schedule", "Runs every", "Last status", "Last run", "Minutes ago"]}
          rows={cron.map((c) => [
            <span key="j" style={c.is_stale ? { color: BAD, fontWeight: 700 } : undefined}>
              {c.job}{c.is_stale ? " · STALE" : ""}
            </span>,
            <code key="s" className="text-xs">{c.schedule}</code>,
            c.expected_every_minutes >= 1440
              ? "day"
              : `${c.expected_every_minutes} min`,
            <span key="st" style={{ color: c.last_status === "succeeded" ? OK : BAD, fontWeight: 600 }}>
              {c.last_status ?? "never ran"}
            </span>,
            dt(c.last_run_at),
            <span key="m" style={c.is_stale ? { color: BAD, fontWeight: 700 } : undefined}>
              {c.minutes_since_run ?? "–"}
            </span>,
          ])}
        />
      </Card>

      {(o.failed_rows ?? []).length > 0 && (
        <Card title="Failing emails">
          <Table
            head={["Kind", "To", "Attempts", "Last error", "Enqueued"]}
            rows={(o.failed_rows as J[]).map((r) => [
              r.kind,
              r.to_email,
              r.attempts,
              <span key="e" className="text-xs" style={{ color: BAD }}>{r.last_error}</span>,
              dt(r.enqueued_at),
            ])}
          />
        </Card>
      )}

      <Card title="Edge calls · last 24h">
        <Table head={["Function", "Calls"]} rows={edge.map((e) => [e.fn, e.calls])} />
      </Card>
    </>
  );
}

/* ---------- Money ---------- */

function Money({ money, run }: { money: J; run: (l: string, fn: () => Promise<J>) => void }) {
  const t = money?.totals ?? {};
  const recent: J[] = money?.recent ?? [];
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Tile label="Gross · all time" value={chf(t.gross_all)} />
        <Tile label="Gross · 30d" value={chf(t.gross_30d)} />
        <Tile label="INFITRA cut · all" value={chf(t.platform_cut_all)} />
        <Tile label="Experts cut · all" value={chf(t.creator_cut_all)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Tile label="Purchases" value={t.succeeded_count ?? 0} />
        <Tile label="Refunds" value={t.refunded_count ?? 0} alarm={(t.refunded_count ?? 0) > 0} />
        <Tile label="Refunded amount" value={chf(t.refunded_all)} />
        <Tile label="Gross · 7d" value={chf(t.gross_7d)} />
      </div>
      <Card title="Recent transactions (100)">
        <Table
          head={["When", "Buyer", "Target", "Amount", "Status", "Entitled", "Receipt", "Stripe", "Repair"]}
          rows={recent.map((r) => [
            dt(r.created_at),
            <span key="b" title={r.buyer_email}>{r.buyer_name ?? r.buyer_email ?? "?"}</span>,
            <span key="t" className="max-w-[16rem] truncate inline-block">{r.target_kind}: {r.target_title}</span>,
            chf(r.amount_gross_cents),
            <span key="s" style={{ color: r.status === "succeeded" ? OK : r.status === "refunded" ? BAD : MUT, fontWeight: 600 }}>{r.status}</span>,
            r.entitled == null ? "–" : r.entitled ? "✓" : <span key="e" style={{ color: BAD, fontWeight: 700 }}>MISSING</span>,
            r.receipt_sent ? "✓" : <span key="rc" style={{ color: BAD, fontWeight: 700 }}>no</span>,
            r.provider_payment_id ? (
              <a key="st" className="underline text-xs" href={`https://dashboard.stripe.com/payments/${r.provider_payment_id}`} target="_blank" rel="noreferrer">open</a>
            ) : "–",
            <span key="rep" className="flex gap-1">
              {r.status === "succeeded" && r.entitled === false && (
                <ActionBtn label="Re-grant" onClick={() => { if (confirm("Re-grant entitlements for this transaction?")) run("Re-grant", () => regrantTx(r.id)); }} />
              )}
              {r.status === "succeeded" && !r.receipt_sent && (
                <ActionBtn label="Re-send receipt" onClick={() => { if (confirm("Enqueue the receipt email again?")) run("Re-send receipt", () => resendReceipt(r.id)); }} />
              )}
            </span>,
          ])}
        />
      </Card>
    </>
  );
}

/* ---------- Payouts ---------- */

function Payouts({ payouts }: { payouts: J }) {
  const xs: J[] = payouts?.experiences ?? [];
  const hist: J[] = payouts?.payout_history ?? [];
  return (
    <>
      {xs.map((x) => {
        const cut = Number(x.creator_cut_cents ?? 0);
        return (
          <Card key={x.id} title={`${x.title} · ${x.status}`}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              <Tile label="Members" value={x.members} />
              <Tile label="Gross" value={chf(x.gross_cents)} />
              <Tile label="Experts cut" value={chf(x.creator_cut_cents)} />
              <Tile label="INFITRA cut" value={chf(x.platform_cut_cents)} />
              <Tile label="Refunds" value={x.refunded_count} alarm={x.refunded_count > 0} />
            </div>
            <Table
              head={["Expert", "Split %", "Amount owed"]}
              rows={[
                [x.owner_name + " (owner)", `${x.owner_percent}%`, chf(Math.round((cut * x.owner_percent) / 100))],
                ...(x.cohosts as J[]).map((ch) => [ch.name, `${ch.percent}%`, chf(Math.round((cut * ch.percent) / 100))]),
              ]}
            />
            <p className="text-xs mt-2" style={{ color: MUT }}>
              Payout window: within 14 days of the experience ending. Pay in the back half so refunds surface first.
            </p>
          </Card>
        );
      })}
      <Card title="Payout history (recorded)">
        <Table
          head={["When", "Expert", "Amount", "Note"]}
          rows={hist.map((h) => [dt(h.created_at), h.creator, `${h.currency ?? "CHF"} ${h.amount}`, h.note ?? "–"])}
        />
      </Card>
    </>
  );
}

/* ---------- People ---------- */

function People({ people, run }: { people: J; run: (l: string, fn: () => Promise<J>) => void }) {
  const [q, setQ] = useState("");
  const list: J[] = (people ?? []).filter((p: J) => {
    if (!q) return true;
    const hay = `${p.display_name ?? ""} ${p.username ?? ""} ${p.email ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const doAnonymize = (p: J) => {
    const typed = prompt(
      `This anonymizes "${p.display_name}" (${p.email}) permanently: profile scrubbed, content voice removed, login locked. Financial records stay (bookkeeping duty).\n\nType ANONYMIZE to confirm.`
    );
    if (typed !== "ANONYMIZE") return;
    const reason = prompt("Reason (goes to the audit log):") ?? "";
    run("Anonymize", () => anonymizeUser(p.id, reason));
  };

  return (
    <Card title={`People (${list.length})`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by name, username, email…"
        className="mb-3 w-full md:w-96 px-3 py-1.5 rounded-lg text-sm"
        style={{ border: "1px solid rgba(15,34,41,0.15)", backgroundColor: "#fff" }}
      />
      <Table
        head={["Joined", "Name", "Email", "Role", "Purchases", "Memberships", "Terms", "Health consent", "Banned", ""]}
        rows={list.map((p) => [
          dt(p.created_at),
          <span key="n">{p.display_name ?? "–"}{p.is_admin ? " ★" : ""}{p.is_founding_expert ? " ⚑" : ""}</span>,
          p.email ?? "–",
          p.role,
          p.purchases,
          p.memberships,
          p.terms_version ? `v${p.terms_version}` : "–",
          p.health_consent_at ? "✓" : "–",
          p.banned_until ? <span key="b" style={{ color: BAD }}>yes</span> : "–",
          p.is_admin ? null : <ActionBtn key="a" label="Anonymize" danger onClick={() => doAnonymize(p)} />,
        ])}
      />
    </Card>
  );
}

/* ---------- Applications ---------- */

// Must match app_pilot_application_status_check in the DB exactly.
const APP_STATUSES = ["new", "contacted", "accepted", "declined"];

function Applications({ data, run }: { data: J; run: (l: string, fn: () => Promise<J>) => void }) {
  const apps: J[] = data?.applications ?? [];
  const waitlist: J[] = data?.waitlist ?? [];
  return (
    <>
      <Card title={`Pilot applications (${apps.length})`}>
        <Table
          head={["When", "Name", "Email", "Expertise", "Audience", "Location", "Partner", "Status", "Set status"]}
          rows={apps.map((a) => [
            dt(a.created_at),
            a.name,
            a.email,
            <span key="x" className="max-w-[14rem] truncate inline-block" title={a.expertise}>{a.expertise}</span>,
            a.audience_size_range ?? "–",
            a.location ?? "–",
            a.has_partner ? "yes" : "no",
            <strong key="s">{a.status ?? "new"}</strong>,
            <span key="set" className="flex gap-1">
              {APP_STATUSES.filter((s) => s !== (a.status ?? "new")).map((s) => (
                <ActionBtn key={s} label={s} onClick={() => run(`Status → ${s}`, () => setApplicationStatus(a.id, s))} />
              ))}
            </span>,
          ])}
        />
      </Card>
      <Card title={`Participant waitlist (${waitlist.length})`}>
        <Table head={["When", "Email", "Source"]} rows={waitlist.map((w) => [dt(w.created_at), w.email, w.source ?? "–"])} />
      </Card>
    </>
  );
}

/* ---------- Experiences ---------- */

function Experiences({ data, run }: { data: J; run: (l: string, fn: () => Promise<J>) => void }) {
  const xs: J[] = data ?? [];
  return (
    <>
      {xs.map((x) => (
        <Card key={x.id} title={`${x.title} · ${x.status} · ${x.owner_name}`}>
          <div className="text-xs mb-2" style={{ color: MUT }}>
            {x.start_date ?? "?"} → {x.end_date ?? "?"} · {x.members} members · {chf(x.gross_cents)} gross
          </div>
          <Table
            head={["Session", "Start", "Min", "Status", "Room", "Live state", ""]}
            rows={(x.sessions as J[]).map((s) => {
              const live = s.started_at && !s.ended_at;
              return [
                <span key="t" className="max-w-[16rem] truncate inline-block">{s.title}</span>,
                dt(s.start_time),
                s.duration_minutes,
                s.status,
                s.has_room ? "✓" : "–",
                live ? <strong key="l" style={{ color: BAD }}>LIVE</strong> : s.ended_at ? "ended" : "upcoming",
                live ? (
                  <ActionBtn key="e" label="Force end" danger onClick={() => { if (confirm(`Force-end "${s.title}"? Participants are dropped into the reflection flow.`)) run("Force end", () => forceEndSession(s.id)); }} />
                ) : null,
              ];
            })}
          />
        </Card>
      ))}
    </>
  );
}

/* ---------- Log ---------- */

function Log({ log }: { log: J }) {
  const rows: J[] = log ?? [];
  return (
    <Card title="Admin action log">
      <Table
        head={["When", "Admin", "Action", "Target", "Detail"]}
        rows={rows.map((l) => [
          dt(l.created_at),
          l.admin_name,
          <strong key="a">{l.action}</strong>,
          <code key="t" className="text-xs">{l.target ?? "–"}</code>,
          <code key="d" className="text-xs max-w-[20rem] truncate inline-block">{l.detail ? JSON.stringify(l.detail) : "–"}</code>,
        ])}
      />
    </Card>
  );
}
