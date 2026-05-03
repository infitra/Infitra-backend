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
              {/* One continuous flow — no internal cards or strips.
                  Reads as a letter: salutation → ask → message → response. */}

              {/* Salutation — inviter + time on a single line. */}
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

              {/* The ask — eyebrow + title. The title is the punch. */}
              <p
                className="text-[10px] uppercase tracking-widest font-headline mb-1.5"
                style={{ color: "#0891b2", fontWeight: 700 }}
              >
                Invited you to explore
              </p>
              {invite.challengeTitle ? (
                <h3
                  className="text-xl md:text-2xl font-headline tracking-tight mb-4"
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
                  className="text-xl md:text-2xl font-headline tracking-tight italic mb-4"
                  style={{
                    color: "#94a3b8",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  an untitled program
                </h3>
              )}

              {/* Cover banner — single visual anchor below the title.
                  Hidden when no cover uploaded; no fabricated placeholder. */}
              {invite.challengeImageUrl && (
                <div
                  className="relative w-full overflow-hidden rounded-xl mb-4"
                  style={{ aspectRatio: "16 / 5", backgroundColor: "#0F2229" }}
                >
                  <img
                    src={invite.challengeImageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}

              {/* The message — personal note, quoted */}
              <blockquote
                className="text-sm md:text-base leading-relaxed pl-4 mb-5"
                style={{
                  color: "#334155",
                  borderLeft: "2px solid rgba(8,145,178,0.35)",
                  fontStyle: "italic",
                }}
              >
                “{invite.message}”
              </blockquote>

              {/* Suggested split — only when actually proposed. The
                  generic "no split yet" line is gone; the non-binding
                  caveat below covers that meaning. */}
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

              {/* Response — actions + single non-binding caveat */}
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
                  Not now
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
