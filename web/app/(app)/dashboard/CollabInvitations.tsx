"use client";

import { useState } from "react";
import { acceptCollabInvite, declineCollabInvite } from "@/app/actions/collaboration";

/**
 * CollabInvitations — redesigned (founder's polish round): warm and personal,
 * "let us do it!" energy, focused on accepting.
 *
 * The person leads: their face, their name, and their message AS the hero.
 * The experience name sits below as quiet context. The suggested-split bar is
 * GONE — terms are set together in the workspace, which is the philosophy;
 * an invitation is "I want to build this with you", not a term sheet.
 * One warm primary action; declining is a whisper.
 */

interface Invite {
  id: string;
  fromName: string;
  fromAvatar: string | null;
  fromTagline: string | null;
  message: string;
  /** Kept in the shape for compatibility; deliberately not rendered. */
  splitPercent: number;
  createdAt: string;
  challengeTitle: string | null;
  challengeImageUrl: string | null;
}

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function CollabInvitations({ invites }: { invites: Invite[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (invites.length === 0) return null;
  const visible = invites.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  async function handleAccept(inviteId: string) {
    setLoading(inviteId);
    await acceptCollabInvite(inviteId);
    // acceptCollabInvite redirects to the workspace on success
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {visible.map((invite) => {
        const isLoading = loading === invite.id;
        return (
          <div
            key={invite.id}
            className="rounded-2xl overflow-hidden relative"
            style={{
              backgroundColor: "#FFFFFF",
              backgroundImage:
                "linear-gradient(128deg, rgba(255,97,48,0.07) 0%, rgba(255,255,255,0) 40%, rgba(156,240,255,0.10) 100%)",
              boxShadow: "0 0 0 1px rgba(255,97,48,0.14), 0 10px 32px rgba(15,34,41,0.10)",
            }}
          >
            <div className="p-6 flex flex-col gap-4">
              {/* WHO — the person, big and warm. */}
              <div className="flex items-center gap-3.5">
                {invite.fromAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={invite.fromAvatar}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                    style={{ boxShadow: `0 0 0 2px ${ORANGE}, 0 4px 14px rgba(255,97,48,0.25)` }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: "rgba(255,97,48,0.12)",
                      boxShadow: `0 0 0 2px ${ORANGE}`,
                    }}
                  >
                    <span className="text-xl font-headline" style={{ color: ORANGE, fontWeight: 700 }}>
                      {invite.fromName[0]}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                    Wants to build with you
                  </p>
                  <p className="text-lg font-black font-headline truncate leading-tight" style={{ color: INK }}>
                    {invite.fromName}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>
                    {invite.fromTagline ? `${invite.fromTagline} · ` : ""}
                    {timeAgo(invite.createdAt)}
                  </p>
                </div>
              </div>

              {/* THE MESSAGE — the hero of the card. */}
              <blockquote
                className="text-lg md:text-xl leading-snug font-headline"
                style={{ color: INK, fontWeight: 700, letterSpacing: "-0.01em" }}
              >
                “{invite.message}”
              </blockquote>

              {/* The experience — quiet context under the message. */}
              <div className="flex items-center gap-2.5">
                {invite.challengeImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={invite.challengeImageUrl}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.25), rgba(8,145,178,0.25))" }}
                  >
                    <span className="text-sm font-black font-headline text-white">
                      {(invite.challengeTitle ?? "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="text-[13px] font-bold font-headline min-w-0 truncate" style={{ color: CYAN }}>
                  {invite.challengeTitle ?? <span className="italic" style={{ color: "#94a3b8" }}>A new experience, built together</span>}
                </p>
              </div>

              {/* RESPOND — accept leads, warm; declining is a whisper. */}
              <div className="mt-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none px-7 py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    style={{
                      backgroundColor: ORANGE,
                      fontWeight: 700,
                      boxShadow: "0 4px 14px rgba(255,97,48,0.32), 0 2px 6px rgba(255,97,48,0.18)",
                    }}
                  >
                    {isLoading ? "…" : "Let's build it →"}
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    disabled={isLoading}
                    className="px-3 py-2.5 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-40 transition-colors"
                  >
                    Not interested
                  </button>
                </div>
                <p className="text-[11px] mt-2" style={{ color: "#94a3b8" }}>
                  Non-binding — you&apos;ll shape the experience and set the terms together in the workspace.
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
