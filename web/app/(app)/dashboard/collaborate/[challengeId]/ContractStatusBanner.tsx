"use client";

interface Party {
  id: string;
  name: string;
  avatar: string | null;
  role: "Owner" | "Cohost";
  status: "confirmed" | "pending" | "declined";
  statusAt?: string | null;
  declineComment?: string | null;
}

interface Props {
  ownerName: string;
  lockedAt: string;
  parties: Party[];
  hasDeclines: boolean;
}

function formatTimeShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Top-of-workspace banner for a locked contract.
 *
 * Design goals (see discussion):
 * - Set the stage: the contract is under review, editing is paused.
 * - Surface the signature state for everyone, up-front (not buried in chips).
 * - Spell out the freeze + reset procedure once, here — so the signing modal
 *   at the bottom stays about personal commitment, not process.
 * - Invite (not push) the reader to scroll before signing.
 */
export function ContractStatusBanner({ ownerName, lockedAt, parties, hasDeclines }: Props) {
  const totalToSign = parties.length; // owner + all cohosts count toward signatures
  const confirmedCount = parties.filter((p) => p.status === "confirmed").length;

  const headline = hasDeclines
    ? "Contract changes requested"
    : confirmedCount === totalToSign
      ? "All signatures in — ready to publish"
      : "Contract under review";

  const accent = hasDeclines ? "#FF6130" : confirmedCount === totalToSign ? "#15803d" : "#0891b2";

  return (
    <div
      className="rounded-2xl p-7 mb-6"
      suppressHydrationWarning
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: `1px solid ${accent}33`,
        boxShadow: `0 0 0 1px ${accent}18 inset`,
      }}
    >
      {/* Headline row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight">
              {headline}
            </h2>
          </div>
          <p className="text-xs font-bold text-[#94a3b8] ml-4" suppressHydrationWarning>
            Locked {formatTimeShort(lockedAt)} by {ownerName}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-black font-headline leading-none" style={{ color: accent }}>
            {confirmedCount}<span className="text-lg text-[#94a3b8]">/{totalToSign}</span>
          </p>
          <p className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider mt-1">
            Signatures
          </p>
        </div>
      </div>

      {/* Signature rows */}
      <div className="space-y-2 mb-5">
        {parties.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 py-2 px-3 rounded-xl"
            style={{ backgroundColor: "rgba(0,0,0,0.025)" }}
          >
            {p.avatar ? (
              <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-cyan-700">{p.name[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black font-headline text-[#0F2229] truncate">{p.name}</p>
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">{p.role}</p>
            </div>
            <div className="shrink-0">
              {p.status === "confirmed" && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black font-headline"
                  style={{ backgroundColor: "rgba(21,128,61,0.1)", color: "#15803d" }}
                  suppressHydrationWarning
                >
                  <span>✓</span>
                  <span>Confirmed</span>
                  {p.statusAt && (
                    <span className="font-normal opacity-70">· {formatTimeShort(p.statusAt)}</span>
                  )}
                </span>
              )}
              {p.status === "pending" && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black font-headline"
                  style={{ backgroundColor: "rgba(234,179,8,0.12)", color: "#a16207" }}
                >
                  <span>⏳</span>
                  <span>Pending</span>
                </span>
              )}
              {p.status === "declined" && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black font-headline"
                  style={{ backgroundColor: "rgba(255,97,48,0.12)", color: "#c2410c" }}
                >
                  <span>✕</span>
                  <span>Requested changes</span>
                </span>
              )}
            </div>
          </div>
        ))}
        {/* Decline comments surface below the row they belong to */}
        {parties
          .filter((p) => p.status === "declined" && p.declineComment)
          .map((p) => (
            <p key={`cmt-${p.id}`} className="text-xs text-[#c2410c] ml-12 italic">
              “{p.declineComment}” — {p.name}
            </p>
          ))}
      </div>

      {/* Procedural note + scroll invitation */}
      <div className="pt-4 border-t" style={{ borderColor: "rgba(15,34,41,0.06)" }}>
        <p className="text-sm text-[#0F2229] leading-relaxed mb-1.5">
          No edits can be made while this is under review. If <span className="font-bold">{ownerName}</span> reopens
          the draft to revise anything, all acceptances reset and everyone needs to accept again.
        </p>
        <p className="text-xs text-[#94a3b8]">
          Review the details below, then accept or request changes at the bottom.
        </p>
      </div>
    </div>
  );
}
