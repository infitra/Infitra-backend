"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptCollabInvite, declineCollabInvite } from "@/app/actions/collaboration";
import { ShareDonut } from "@/app/components/ShareDonut";

interface Invite {
  id: string;
  fromName: string;
  fromAvatar: string | null;
  fromTagline: string | null;
  message: string;
  splitPercent: number;
  createdAt: string;
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
        <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Collaboration Invites</h2>
      </div>

      <div className="space-y-4">
        {visible.map((invite) => (
          <div key={invite.id} className="rounded-2xl infitra-card p-6" style={{ border: "1px solid rgba(156,240,255,0.25)" }}>
            <div className="flex items-start gap-4">
              {/* Inviter avatar */}
              {invite.fromAvatar ? (
                <img src={invite.fromAvatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                  <span className="text-lg font-black font-headline text-cyan-700">{invite.fromName[0]}</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-black font-headline text-[#0F2229]">{invite.fromName}</h3>
                  <span className="text-[10px] text-[#94a3b8]">{timeAgo(invite.createdAt)}</span>
                </div>
                {invite.fromTagline && (
                  <p className="text-xs text-[#64748b] mb-2">{invite.fromTagline}</p>
                )}
                <p className="text-sm text-[#334155] mb-4 leading-relaxed">{invite.message}</p>

                {/* Split visual + actions */}
                <div className="flex items-center gap-6">
                  <ShareDonut
                    size={80}
                    shares={[
                      { label: "You", percent: invite.splitPercent, color: "#9CF0FF" },
                      { label: invite.fromName, percent: 100 - invite.splitPercent, color: "#FF6130" },
                    ]}
                  />

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAccept(invite.id)}
                      disabled={loading === invite.id}
                      className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
                      style={{ backgroundColor: "#0891b2" }}
                    >
                      {loading === invite.id ? "..." : "Interested"}
                    </button>
                    <button
                      onClick={() => handleDecline(invite.id)}
                      disabled={loading === invite.id}
                      className="px-6 py-2 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-40"
                      style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                    >
                      Not Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
