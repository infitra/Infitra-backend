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
              className="rounded-2xl infitra-card overflow-hidden relative p-6"
              style={{ border: "1px solid rgba(156,240,255,0.30)" }}
            >
              {/* Reads like a real personal message:
                    who → what they said → what it's about → respond
                  Not a system notification (which would lead with the
                  thing, then the message). */}

              {/* Who — avatar + name + time + tagline */}
              <div className="flex items-center gap-3 mb-5">
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
                    <span
                      className="ml-2 text-[11px] font-normal"
                      style={{ color: "#94a3b8" }}
                    >
                      · {timeAgo(invite.createdAt)}
                    </span>
                  </p>
                  {invite.fromTagline ? (
                    <p className="text-xs truncate" style={{ color: "#64748b" }}>
                      {invite.fromTagline}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* What they said — the personal message takes the focal slot.
                  Larger than before, cyan rule, italic. This is the moment. */}
              <blockquote
                className="text-base md:text-lg leading-relaxed pl-4 mb-6"
                style={{
                  color: "#0F2229",
                  borderLeft: "3px solid #0891b2",
                  fontStyle: "italic",
                }}
              >
                “{invite.message}”
              </blockquote>

              {/* What it's about — compact context block. Cover is a
                  small thumbnail (not a banner), title sits next to it,
                  small eyebrow above. Reads as supporting info. */}
              <div
                className="flex items-center gap-3 mb-5 pt-4"
                style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}
              >
                {invite.challengeImageUrl ? (
                  <img
                    src={invite.challengeImageUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,97,48,0.18), rgba(8,145,178,0.18))",
                    }}
                  >
                    <span
                      className="text-base font-headline"
                      style={{ color: "#0F2229", fontWeight: 700 }}
                    >
                      {(invite.challengeTitle ?? "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] uppercase tracking-widest font-headline"
                    style={{ color: "#0891b2", fontWeight: 700 }}
                  >
                    Invited you to explore
                  </p>
                  <p
                    className="text-base font-headline truncate"
                    style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.01em" }}
                  >
                    {invite.challengeTitle ?? (
                      <span className="italic" style={{ color: "#94a3b8" }}>
                        an untitled program
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Suggested split — only when actually proposed */}
              {hasSuggestedSplit && (
                <div
                  className="px-3 py-2.5 rounded-lg mb-5"
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
                </div>
              )}

              {/* Respond */}
              <div className="flex items-center gap-2 mb-2.5">
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
                  {isLoading ? "..." : "Open workspace"}
                </button>
                <button
                  onClick={() => handleDecline(invite.id)}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-40 transition-colors"
                >
                  Not interested
                </button>
              </div>
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                Non-binding — you&apos;ll set the terms together in the workspace.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
