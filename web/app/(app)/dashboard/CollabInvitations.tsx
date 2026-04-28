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
              className="rounded-2xl infitra-card p-6"
              style={{ border: "1px solid rgba(156,240,255,0.30)" }}
            >
              {/* Inviter row */}
              <div className="flex items-center gap-3 mb-5">
                {invite.fromAvatar ? (
                  <img
                    src={invite.fromAvatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black font-headline text-cyan-700">
                      {invite.fromName[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black font-headline text-[#0F2229] truncate">
                      {invite.fromName}
                    </p>
                    <span className="text-[10px] text-[#94a3b8] shrink-0">
                      · invited you {timeAgo(invite.createdAt)}
                    </span>
                  </div>
                  {invite.fromTagline && (
                    <p className="text-[11px] text-[#64748b] truncate">{invite.fromTagline}</p>
                  )}
                </div>
              </div>

              {/* Proposal block — cover thumbnail (small, contextual) next
                  to title + message. The cover used to be a 5:1 hero banner
                  that pushed the actual content below the fold; now it's a
                  64×64 thumbnail that anchors the proposal without dominating. */}
              <div className="flex items-start gap-4 mb-5">
                {invite.challengeImageUrl && (
                  <img
                    src={invite.challengeImageUrl}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {invite.challengeTitle && (
                    <h3
                      className="text-lg md:text-xl font-headline tracking-tight mb-1.5"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      {invite.challengeTitle}
                    </h3>
                  )}
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#334155" }}
                  >
                    {invite.message}
                  </p>
                </div>
              </div>

                {/* Suggested split — labelled as a suggestion, with the
                    workspace-handoff caveat. Hidden entirely when no split
                    was proposed (split === 0 → "discuss in workspace"). */}
                {hasSuggestedSplit ? (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                    style={{
                      backgroundColor: "rgba(156,240,255,0.08)",
                      border: "1px solid rgba(8,145,178,0.18)",
                    }}
                  >
                    {/* Inline two-tone split bar — compact alternative to the
                        donut so the visual weight matches a "suggestion" */}
                    <div className="flex-1 min-w-0">
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
                        className="w-full h-1.5 rounded-full overflow-hidden flex"
                        style={{ backgroundColor: "rgba(15,34,41,0.06)" }}
                      >
                        <div
                          style={{
                            width: `${invite.splitPercent}%`,
                            backgroundColor: "#0891b2",
                          }}
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
                  </div>
                ) : (
                  <p
                    className="text-[11px] mb-5 px-4 py-2.5 rounded-xl"
                    style={{
                      color: "#64748b",
                      backgroundColor: "rgba(15,34,41,0.03)",
                      border: "1px solid rgba(15,34,41,0.06)",
                    }}
                  >
                    No split proposed yet — you&apos;ll set the terms together in the workspace.
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    style={{
                      backgroundColor: "#0891b2",
                      fontWeight: 700,
                      boxShadow:
                        "0 4px 14px rgba(8,145,178,0.30), 0 2px 6px rgba(8,145,178,0.16)",
                    }}
                  >
                    {isLoading ? "..." : "Open workspace"}
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-40 transition-colors"
                    style={{ border: "1px solid rgba(15,34,41,0.10)" }}
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
