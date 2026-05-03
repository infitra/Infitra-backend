"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptCollabInvite, declineCollabInvite } from "@/app/actions/collaboration";

interface Invite {
  id: string;
  fromName: string;
  fromAvatar: string | null;
  fromTagline: string | null;
  message: string;
  /**
   * Suggested revenue % proposed for the recipient by the inviter.
   * 0 (or null) is treated as "no split proposed yet" — final terms
   * are agreed in the workspace, not on the invite card.
   */
  splitPercent: number;
  createdAt: string;
  /** Title the inviter actually picked. Null when still default. */
  challengeTitle: string | null;
  /** Cover image the inviter actually picked. Null if not set. */
  challengeImageUrl: string | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function CollabInvitations({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (invites.length === 0) return null;
  const visible = invites.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  async function handleAccept(inviteId: string) {
    setLoading(inviteId);
    await acceptCollabInvite(inviteId);
    // acceptCollabInvite redirects to workspace on success
  }

  async function handleDecline(inviteId: string) {
    setLoading(inviteId);
    const result = await declineCollabInvite(inviteId);
    if (!result.error) {
      setDismissed((prev) => new Set([...prev, inviteId]));
    }
    setLoading(null);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#9CF0FF" }} />
        <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">
          Collaboration Invites
        </h2>
      </div>

      <div className="space-y-4">
        {visible.map((invite) => {
          const hasSuggestedSplit = invite.splitPercent > 0 && invite.splitPercent < 100;
          const isLoading = loading === invite.id;

          return (
            <div
              key={invite.id}
              className="rounded-2xl infitra-card overflow-hidden relative"
              style={{ border: "1px solid rgba(156,240,255,0.30)" }}
            >
              {/* Inviter strip — top of the card, larger avatar so the
                  human is prominent. Reads as "person reaching out", not
                  "system notification". */}
              <div
                className="flex items-center gap-3 px-6 pt-5 pb-4"
                style={{
                  backgroundColor: "rgba(156,240,255,0.06)",
                  borderBottom: "1px solid rgba(8,145,178,0.10)",
                }}
              >
                {invite.fromAvatar ? (
                  <img
                    src={invite.fromAvatar}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                    style={{
                      border: "2px solid #FFFFFF",
                      boxShadow: "0 4px 12px rgba(8,145,178,0.20)",
                    }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: "rgba(8,145,178,0.18)",
                      border: "2px solid #FFFFFF",
                      boxShadow: "0 4px 12px rgba(8,145,178,0.20)",
                    }}
                  >
                    <span
                      className="text-base font-headline"
                      style={{ color: "#0891b2", fontWeight: 700 }}
                    >
                      {invite.fromName[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-base font-headline truncate"
                    style={{ color: "#0F2229", fontWeight: 700 }}
                  >
                    {invite.fromName}
                  </p>
                  {invite.fromTagline ? (
                    <p className="text-xs truncate" style={{ color: "#64748b" }}>
                      {invite.fromTagline}
                    </p>
                  ) : null}
                </div>
                <span
                  className="text-[10px] uppercase tracking-widest font-headline shrink-0 hidden sm:inline"
                  style={{ color: "#94a3b8", fontWeight: 700 }}
                >
                  Invited you {timeAgo(invite.createdAt)}
                </span>
              </div>

              {/* Proposal — reads as a letter. "Invited you to collaborate
                  on:" is the ask, then the title is the punchline. The
                  message is presented as a quote with a thin cyan rule on
                  the left (epistolary treatment). */}
              <div className="px-6 pt-5 pb-4 space-y-4">
                <div className="flex items-start gap-4">
                  {invite.challengeImageUrl && (
                    <img
                      src={invite.challengeImageUrl}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-widest font-headline mb-1"
                      style={{ color: "#0891b2", fontWeight: 700 }}
                    >
                      Invited you to collaborate on
                    </p>
                    {invite.challengeTitle ? (
                      <h3
                        className="text-xl md:text-2xl font-headline tracking-tight"
                        style={{
                          color: "#0F2229",
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {invite.challengeTitle}
                      </h3>
                    ) : (
                      <h3
                        className="text-xl md:text-2xl font-headline tracking-tight italic"
                        style={{
                          color: "#94a3b8",
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        an untitled program
                      </h3>
                    )}
                  </div>
                </div>

                {/* Message — quote treatment */}
                <blockquote
                  className="text-sm md:text-base leading-relaxed pl-4"
                  style={{
                    color: "#334155",
                    borderLeft: "2px solid rgba(8,145,178,0.35)",
                    fontStyle: "italic",
                  }}
                >
                  “{invite.message}”
                </blockquote>

                {/* Suggested split / "no split yet" — quieter than before */}
                {hasSuggestedSplit ? (
                  <div
                    className="px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: "rgba(156,240,255,0.06)",
                      border: "1px solid rgba(8,145,178,0.15)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[10px] uppercase tracking-widest font-headline"
                        style={{ color: "#94a3b8", fontWeight: 700 }}
                      >
                        Suggested split
                      </span>
                      <span
                        className="text-[11px] font-headline"
                        style={{ color: "#0F2229", fontWeight: 700 }}
                      >
                        You {invite.splitPercent}% · {invite.fromName} {100 - invite.splitPercent}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full overflow-hidden flex"
                      style={{ backgroundColor: "rgba(15,34,41,0.06)" }}
                    >
                      <div
                        style={{ width: `${invite.splitPercent}%`, backgroundColor: "#0891b2" }}
                      />
                      <div
                        style={{
                          width: `${100 - invite.splitPercent}%`,
                          backgroundColor: "#FF6130",
                        }}
                      />
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: "#94a3b8" }}>
                      Final terms agreed together in the workspace.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                    No split proposed yet — you&apos;ll set the terms together in the
                    workspace.
                  </p>
                )}
              </div>

              {/* Actions — primary stays prominent (orange this time so it
                  reads as the decisive yes), secondary is small/subdued. */}
              <div className="flex items-center gap-2 px-6 pb-5">
                <button
                  onClick={() => handleAccept(invite.id)}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    backgroundColor: "#FF6130",
                    fontWeight: 700,
                    boxShadow:
                      "0 4px 14px rgba(255,97,48,0.32), 0 2px 6px rgba(255,97,48,0.18)",
                  }}
                >
                  {isLoading ? "..." : "Accept · open workspace"}
                </button>
                <button
                  onClick={() => handleDecline(invite.id)}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-40 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
