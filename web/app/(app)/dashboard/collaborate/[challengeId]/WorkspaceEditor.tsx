"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShareDonut } from "@/app/components/ShareDonut";
import { updateChallenge, publishChallenge } from "@/app/actions/challenge";
import { lockTerms, confirmTerms, requestChanges, reactivateDrafting, updateCohostSplit } from "@/app/actions/collaboration";

interface Props {
  challenge: {
    id: string;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string;
    priceCents: number;
    status: string;
    imageUrl: string | null;
    contractId: string | null;
  };
  isOwner: boolean;
  currentUserId: string;
  ownerProfile: { name: string; avatar: string | null };
  ownerSplit: number;
  cohosts: { id: string; name: string; avatar: string | null; splitPercent: number }[];
  sessions: { id: string; title: string; startTime: string; durationMinutes: number; hostId: string; hostName: string }[];
  contract: {
    id: string;
    lockedAt: string;
    acceptances: string[];
    declines: { cohostId: string; comment: string | null }[];
  } | null;
}

export function WorkspaceEditor({ challenge, isOwner, currentUserId, ownerProfile, ownerSplit, cohosts, sessions, contract }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDraft = challenge.status === "draft";
  const isLocked = !!contract;
  const allAccepted = contract ? cohosts.every((c) => contract.acceptances.includes(c.id)) : false;
  const hasDeclines = contract ? contract.declines.length > 0 : false;
  const myDecline = contract?.declines.find((d) => d.cohostId === currentUserId);

  const shares = [
    { label: ownerProfile.name, percent: ownerSplit, color: "#FF6130" },
    ...cohosts.map((c) => ({ label: c.name, percent: c.splitPercent, color: "#9CF0FF" })),
  ];

  async function handleLockTerms() {
    setLocking(true); setError(null);
    const result = await lockTerms(challenge.id);
    if (result.error) { setError(result.error); setLocking(false); return; }
    setSuccess("Contract locked. Waiting for collaborators to confirm.");
    setLocking(false);
    router.refresh();
  }

  async function handleConfirm() {
    if (!contract) return;
    setConfirming(true); setError(null);
    const result = await confirmTerms(contract.id);
    if (result.error) { setError(result.error); setConfirming(false); return; }
    setSuccess("Terms confirmed!");
    setConfirming(false);
    router.refresh();
  }

  async function handleRequestChanges() {
    if (!contract) return;
    const comment = prompt("What changes would you like? (optional)");
    setConfirming(true); setError(null);
    const result = await requestChanges(contract.id, comment ?? undefined);
    if (result.error) { setError(result.error); setConfirming(false); return; }
    setSuccess("Change request sent.");
    setConfirming(false);
    router.refresh();
  }

  async function handleReactivate() {
    if (!contract) return;
    setLocking(true); setError(null);
    const result = await reactivateDrafting(challenge.id, contract.id);
    if (result.error) { setError(result.error); setLocking(false); return; }
    setSuccess("Draft reactivated. You can make changes and lock again.");
    setLocking(false);
    router.refresh();
  }

  async function handlePublish() {
    setPublishing(true); setError(null);
    const result = await publishChallenge(challenge.id);
    if (result?.error) { setError(result.error); setPublishing(false); return; }
    // publishChallenge redirects on success
  }

  return (
    <div className="space-y-6">
      {/* Challenge details card */}
      <div className="rounded-2xl infitra-card p-6">
        <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight mb-4">
          {challenge.title || "Untitled Collaboration"}
        </h2>

        {isDraft && isOwner && (
          <Link
            href={`/dashboard/challenges/${challenge.id}`}
            className="text-xs font-bold font-headline text-[#FF6130] mb-4 block"
          >
            Edit Challenge Details →
          </Link>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider mb-1">Dates</p>
            <p className="font-bold text-[#0F2229]">{challenge.startDate} → {challenge.endDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider mb-1">Price</p>
            <p className="font-bold text-[#0F2229]">
              {challenge.priceCents > 0 ? `CHF ${(challenge.priceCents / 100).toFixed(0)}` : "Not set"}
            </p>
          </div>
        </div>
      </div>

      {/* Share split */}
      <div className="rounded-2xl infitra-card p-6">
        <h3 className="text-sm font-bold font-headline text-[#94a3b8] uppercase tracking-wider mb-4">Revenue Share</h3>
        <div className="flex items-center gap-8">
          <ShareDonut size={120} shares={shares} />
          <div className="flex-1 space-y-3">
            {/* Owner */}
            <div className="flex items-center gap-3">
              {ownerProfile.avatar ? (
                <img src={ownerProfile.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-orange-700">{ownerProfile.name[0]}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-bold font-headline text-[#0F2229]">{ownerProfile.name}</p>
                <p className="text-[10px] text-[#94a3b8]">Owner · {ownerSplit}%</p>
              </div>
            </div>
            {/* Cohosts */}
            {cohosts.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                {c.avatar ? (
                  <img src={c.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-cyan-700">{c.name[0]}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold font-headline text-[#0F2229]">{c.name}</p>
                  <p className="text-[10px] text-[#94a3b8]">Collaborator · {c.splitPercent}%</p>
                </div>
                {/* Contract status indicator */}
                {contract && (
                  <span className="text-[10px] font-bold font-headline">
                    {contract.acceptances.includes(c.id) ? (
                      <span className="text-green-600">✓ Confirmed</span>
                    ) : contract.declines.some((d) => d.cohostId === c.id) ? (
                      <span className="text-red-500">✕ Changes requested</span>
                    ) : (
                      <span className="text-[#94a3b8]">⏳ Pending</span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-headline text-[#94a3b8] uppercase tracking-wider">Sessions · {sessions.length}</h3>
          {isDraft && !isLocked && (
            <Link href={`/dashboard/challenges/${challenge.id}`} className="text-xs font-bold font-headline text-[#FF6130]">
              Manage Sessions →
            </Link>
          )}
        </div>
        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(15,34,41,0.06)" }}>
                <div>
                  <p className="text-sm font-bold font-headline text-[#0F2229]">{s.title}</p>
                  <p className="text-[10px] text-[#94a3b8]">
                    {new Date(s.startTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    {" · "}{s.durationMinutes} min
                  </p>
                </div>
                <span className="text-[10px] font-bold font-headline text-[#94a3b8]">Host: {s.hostName}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8] text-center py-4">No sessions yet. Add them in the challenge editor.</p>
        )}
      </div>

      {/* Contract Actions */}
      <div className="rounded-2xl infitra-card p-6">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {success && <p className="text-sm text-green-600 mb-4">{success}</p>}

        {!isLocked && isDraft && isOwner && (
          <div>
            <p className="text-sm text-[#64748b] mb-4">
              When you&apos;re happy with the challenge details and revenue share, lock the terms for your collaborator to review and confirm.
            </p>
            <button
              onClick={handleLockTerms}
              disabled={locking || cohosts.length === 0}
              className="px-6 py-3 rounded-full text-white text-sm font-black font-headline disabled:opacity-40 w-full"
              style={{ backgroundColor: "#0891b2" }}
            >
              {locking ? "Locking..." : "Lock Terms for Review"}
            </button>
          </div>
        )}

        {isLocked && !allAccepted && !hasDeclines && !isOwner && !contract?.acceptances.includes(currentUserId) && (
          <div>
            <p className="text-sm text-[#64748b] mb-4">
              Review the challenge details, revenue share, and sessions above. When you&apos;re ready, confirm or request changes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 px-6 py-3 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
                style={{ backgroundColor: "#0891b2" }}
              >
                {confirming ? "..." : "Confirm Terms"}
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={confirming}
                className="px-6 py-3 rounded-full text-sm font-bold font-headline text-[#94a3b8] disabled:opacity-40"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              >
                Request Changes
              </button>
            </div>
          </div>
        )}

        {isLocked && hasDeclines && isOwner && (
          <div>
            <p className="text-sm text-[#64748b] mb-2">
              A collaborator requested changes.
            </p>
            {contract?.declines.map((d) => (
              <p key={d.cohostId} className="text-sm text-red-500 mb-2">
                {cohosts.find((c) => c.id === d.cohostId)?.name}: {d.comment || "No comment provided"}
              </p>
            ))}
            <button
              onClick={handleReactivate}
              disabled={locking}
              className="px-6 py-3 rounded-full text-sm font-black font-headline text-[#0F2229] disabled:opacity-40 w-full"
              style={{ border: "1px solid rgba(0,0,0,0.12)" }}
            >
              {locking ? "..." : "Reactivate Draft"}
            </button>
          </div>
        )}

        {isLocked && allAccepted && isOwner && (
          <div>
            <p className="text-sm text-green-600 font-bold mb-4">
              All collaborators confirmed. Ready to publish!
            </p>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-6 py-3 rounded-full text-white text-sm font-black font-headline disabled:opacity-40 w-full"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
            >
              {publishing ? "Publishing..." : "Publish Challenge"}
            </button>
          </div>
        )}

        {isLocked && allAccepted && !isOwner && (
          <p className="text-sm text-green-600 font-bold text-center">
            All confirmed. Waiting for {ownerProfile.name} to publish.
          </p>
        )}

        {isLocked && !hasDeclines && contract?.acceptances.includes(currentUserId) && !allAccepted && (
          <p className="text-sm text-[#0891b2] font-bold text-center">
            You confirmed. Waiting for others.
          </p>
        )}
      </div>
    </div>
  );
}
