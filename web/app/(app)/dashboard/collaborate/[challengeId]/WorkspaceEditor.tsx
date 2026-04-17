"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShareDonut } from "@/app/components/ShareDonut";
import { updateChallenge, publishChallenge, createChallengeSession } from "@/app/actions/challenge";
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

  // Editable fields
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description ?? "");
  const [startDate, setStartDate] = useState(challenge.startDate);
  const [endDate, setEndDate] = useState(challenge.endDate);
  const [price, setPrice] = useState(challenge.priceCents > 0 ? (challenge.priceCents / 100).toString() : "");

  // Add session
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessTitle, setSessTitle] = useState("");
  const [sessDate, setSessDate] = useState("");
  const [sessDuration, setSessDuration] = useState("60");
  const [addingSession, setAddingSession] = useState(false);

  const isDraft = challenge.status === "draft";
  const isLocked = !!contract;
  const allAccepted = contract ? cohosts.every((c) => contract.acceptances.includes(c.id)) : false;
  const hasDeclines = contract ? contract.declines.length > 0 : false;
  const canEdit = isDraft && !isLocked;

  const shares = [
    { label: ownerProfile.name, percent: ownerSplit, color: "#FF6130" },
    ...cohosts.map((c) => ({ label: c.name, percent: c.splitPercent, color: "#9CF0FF" })),
  ];

  async function handleSave() {
    setSaving(true); setError(null);
    const formData = new FormData();
    formData.set("challenge_id", challenge.id);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("start_date", startDate);
    formData.set("end_date", endDate);
    formData.set("price", price);
    if (challenge.imageUrl) formData.set("image_url", challenge.imageUrl);

    const result = await updateChallenge(null, formData);
    if (result?.error) { setError(result.error); setSaving(false); return; }
    setSuccess("Saved"); setTimeout(() => setSuccess(null), 2000);
    setSaving(false);
    router.refresh();
  }

  async function handleAddSession() {
    if (!sessTitle.trim() || !sessDate) return;
    setAddingSession(true); setError(null);
    const result = await createChallengeSession(
      challenge.id, sessTitle.trim(), sessDate, parseInt(sessDuration)
    );
    if (result?.error) { setError(result.error); setAddingSession(false); return; }
    setSessTitle(""); setSessDate(""); setShowAddSession(false);
    setAddingSession(false);
    router.refresh();
  }

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
  }

  return (
    <div className="space-y-6">
      {/* Challenge details — editable inline */}
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-headline text-[#94a3b8] uppercase tracking-wider">Challenge Details</h3>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-full text-xs font-bold font-headline text-white disabled:opacity-40"
              style={{ backgroundColor: "#FF6130" }}
            >
              {saving ? "Saving..." : success ?? "Save"}
            </button>
          )}
        </div>

        {canEdit ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Title</label>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl p-3 text-sm font-bold font-headline focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Start</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl p-2.5 text-sm focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }} />
              </div>
              <div>
                <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">End</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl p-2.5 text-sm focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }} />
              </div>
              <div>
                <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Price (CHF)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
                  className="w-full rounded-xl p-2.5 text-sm focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight mb-2">{challenge.title}</h2>
            {challenge.description && <p className="text-sm text-[#64748b] mb-3">{challenge.description}</p>}
            <div className="flex gap-4 text-sm text-[#94a3b8]">
              <span>{challenge.startDate} → {challenge.endDate}</span>
              <span>CHF {(challenge.priceCents / 100).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Revenue share */}
      <div className="rounded-2xl infitra-card p-6">
        <h3 className="text-sm font-bold font-headline text-[#94a3b8] uppercase tracking-wider mb-4">Revenue Share</h3>
        <div className="flex items-center gap-8">
          <ShareDonut size={120} shares={shares} />
          <div className="flex-1 space-y-3">
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

      {/* Sessions — inline management */}
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-headline text-[#94a3b8] uppercase tracking-wider">Sessions · {sessions.length}</h3>
          {canEdit && (
            <button onClick={() => setShowAddSession(!showAddSession)} className="text-xs font-bold font-headline text-[#FF6130]">
              {showAddSession ? "Cancel" : "+ Add Session"}
            </button>
          )}
        </div>

        {/* Add session form */}
        {showAddSession && canEdit && (
          <div className="p-4 rounded-xl mb-4" style={{ border: "1px solid rgba(15,34,41,0.08)", backgroundColor: "rgba(255,255,255,0.5)" }}>
            <div className="space-y-3">
              <input
                value={sessTitle} onChange={(e) => setSessTitle(e.target.value)}
                placeholder="Session title"
                className="w-full rounded-xl p-2.5 text-sm focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={sessDate} onChange={(e) => setSessDate(e.target.value)}
                  className="rounded-xl p-2.5 text-sm focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }} />
                <div className="flex items-center gap-2">
                  <input type="number" value={sessDuration} onChange={(e) => setSessDuration(e.target.value)} min="5" max="480"
                    className="w-20 rounded-xl p-2.5 text-sm focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }} />
                  <span className="text-xs text-[#94a3b8]">min</span>
                </div>
              </div>
              <button
                onClick={handleAddSession}
                disabled={addingSession || !sessTitle.trim() || !sessDate}
                className="px-4 py-2 rounded-full text-xs font-bold font-headline text-white disabled:opacity-40"
                style={{ backgroundColor: "#0891b2" }}
              >
                {addingSession ? "Adding..." : "Add Session"}
              </button>
            </div>
          </div>
        )}

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
          <p className="text-sm text-[#94a3b8] text-center py-4">No sessions yet. Add your first session above.</p>
        )}
      </div>

      {/* Contract Actions */}
      <div className="rounded-2xl infitra-card p-6">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {!isLocked && isDraft && isOwner && (
          <div>
            <p className="text-sm text-[#64748b] mb-4">
              When you&apos;re happy with the details and revenue share, lock the terms for your collaborator to review.
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

        {!isLocked && isDraft && !isOwner && (
          <p className="text-sm text-[#94a3b8] text-center">
            Waiting for {ownerProfile.name} to finalize and lock terms.
          </p>
        )}

        {isLocked && !allAccepted && !hasDeclines && !isOwner && !contract?.acceptances.includes(currentUserId) && (
          <div>
            <p className="text-sm text-[#64748b] mb-4">
              Review the challenge details above. When ready, confirm or request changes.
            </p>
            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={confirming}
                className="flex-1 px-6 py-3 rounded-full text-white text-sm font-black font-headline disabled:opacity-40" style={{ backgroundColor: "#0891b2" }}>
                {confirming ? "..." : "Confirm Terms"}
              </button>
              <button onClick={handleRequestChanges} disabled={confirming}
                className="px-6 py-3 rounded-full text-sm font-bold font-headline text-[#94a3b8] disabled:opacity-40" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                Request Changes
              </button>
            </div>
          </div>
        )}

        {isLocked && hasDeclines && isOwner && (
          <div>
            <p className="text-sm text-[#64748b] mb-2">A collaborator requested changes.</p>
            {contract?.declines.map((d) => (
              <p key={d.cohostId} className="text-sm text-red-500 mb-2">
                {cohosts.find((c) => c.id === d.cohostId)?.name}: {d.comment || "No comment provided"}
              </p>
            ))}
            <button onClick={handleReactivate} disabled={locking}
              className="px-6 py-3 rounded-full text-sm font-black font-headline text-[#0F2229] disabled:opacity-40 w-full" style={{ border: "1px solid rgba(0,0,0,0.12)" }}>
              {locking ? "..." : "Reactivate Draft"}
            </button>
          </div>
        )}

        {isLocked && allAccepted && isOwner && (
          <div>
            <p className="text-sm text-green-600 font-bold mb-4">All collaborators confirmed. Ready to publish!</p>
            <button onClick={handlePublish} disabled={publishing}
              className="px-6 py-3 rounded-full text-white text-sm font-black font-headline disabled:opacity-40 w-full"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}>
              {publishing ? "Publishing..." : "Publish Challenge"}
            </button>
          </div>
        )}

        {isLocked && allAccepted && !isOwner && (
          <p className="text-sm text-green-600 font-bold text-center">All confirmed. Waiting for {ownerProfile.name} to publish.</p>
        )}

        {isLocked && !hasDeclines && contract?.acceptances.includes(currentUserId) && !allAccepted && (
          <p className="text-sm text-[#0891b2] font-bold text-center">You confirmed. Waiting for others.</p>
        )}

        {isLocked && !hasDeclines && isOwner && !allAccepted && (
          <p className="text-sm text-[#0891b2] font-bold text-center">Contract locked. Waiting for collaborators to confirm.</p>
        )}
      </div>
    </div>
  );
}
