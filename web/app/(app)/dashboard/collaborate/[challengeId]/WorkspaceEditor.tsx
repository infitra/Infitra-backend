"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShareDonut } from "@/app/components/ShareDonut";
import { ImageSelector } from "@/app/components/ImageSelector";
import { CollabInviteFlow } from "@/app/(app)/dashboard/create/CollabInviteFlow";
import { updateChallenge, publishChallenge, createChallengeSession, removeChallengeSession } from "@/app/actions/challenge";
import { lockTerms, confirmTerms, requestChanges, reactivateDrafting, updateCohostSplit, addSessionCohost, removeSessionCohost } from "@/app/actions/collaboration";

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
  sessions: {
    id: string; title: string; startTime: string; durationMinutes: number;
    hostId: string; hostName: string; hostAvatar?: string | null;
    imageUrl?: string | null;
    cohosts: { id: string; name: string; avatar: string | null; splitPercent: number }[];
  }[];
  pendingInvites?: {
    id: string; toId: string; toName: string; toAvatar: string | null;
    splitPercent: number; message: string;
  }[];
  contract: {
    id: string;
    lockedAt: string;
    acceptances: string[];
    declines: { cohostId: string; comment: string | null }[];
  } | null;
}

export function WorkspaceEditor({ challenge, isOwner, currentUserId, ownerProfile, ownerSplit, cohosts, sessions, pendingInvites, contract }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable challenge fields
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description ?? "");
  const [startDate, setStartDate] = useState(challenge.startDate);
  const [endDate, setEndDate] = useState(challenge.endDate);
  const [price, setPrice] = useState(challenge.priceCents > 0 ? (challenge.priceCents / 100).toString() : "");
  const [imageUrl, setImageUrl] = useState(challenge.imageUrl);

  // Editable cohost splits (owner only)
  const [cohostSplits, setCohostSplits] = useState<Record<string, number>>(
    () => Object.fromEntries(cohosts.map((c) => [c.id, c.splitPercent]))
  );
  const currentOwnerSplit = 100 - Object.values(cohostSplits).reduce((a, b) => a + b, 0);

  // Add session state
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessTitle, setSessTitle] = useState("");
  const [sessDate, setSessDate] = useState("");
  const [sessDuration, setSessDuration] = useState("60");
  const [sessImageUrl, setSessImageUrl] = useState<string | null>(null);
  const [addingSession, setAddingSession] = useState(false);

  const isDraft = challenge.status === "draft";
  const isLocked = !!contract;
  const allAccepted = contract ? cohosts.every((c) => contract.acceptances.includes(c.id)) : false;
  const hasDeclines = contract ? contract.declines.length > 0 : false;
  const canEdit = isDraft && !isLocked && isOwner;
  const canViewEdit = isDraft && !isLocked;

  const shares = [
    { label: ownerProfile.name, percent: currentOwnerSplit, color: "#FF6130" },
    ...cohosts.map((c) => ({ label: c.name, percent: cohostSplits[c.id] ?? c.splitPercent, color: "#9CF0FF" })),
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
    if (imageUrl) formData.set("image_url", imageUrl);

    const result = await updateChallenge(null, formData);
    if (result?.error) { setError(result.error); setSaving(false); return; }
    setSuccess("Saved"); setTimeout(() => setSuccess(null), 2000);
    setSaving(false);
    router.refresh();
  }

  async function handleSaveCohostSplit(cohostId: string, newSplit: number) {
    const result = await updateCohostSplit(challenge.id, cohostId, newSplit);
    if (result.error) { setError(result.error); return; }
    setCohostSplits((prev) => ({ ...prev, [cohostId]: newSplit }));
    router.refresh();
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm("Delete this session?")) return;
    setError(null);
    const result = await removeChallengeSession(challenge.id, sessionId);
    if (result?.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleAddSessionCohost(sessionId: string, cohostId: string) {
    setError(null);
    const result = await addSessionCohost(sessionId, cohostId, 0);
    if (result?.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleRemoveSessionCohost(sessionId: string, cohostId: string) {
    setError(null);
    const result = await removeSessionCohost(sessionId, cohostId);
    if (result?.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleAddSession() {
    if (!sessTitle.trim() || !sessDate) return;
    setAddingSession(true); setError(null);
    const result = await createChallengeSession(
      challenge.id, sessTitle.trim(), sessDate, parseInt(sessDuration), sessImageUrl
    );
    if (result?.error) { setError(result.error); setAddingSession(false); return; }
    setSessTitle(""); setSessDate(""); setSessImageUrl(null); setShowAddSession(false);
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
      {/* ── COVER IMAGE ─────────────────────────── */}
      <div className="rounded-2xl infitra-card p-6">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider mb-4">Cover Image</h3>
        <div className="max-w-md">
          {canEdit ? (
            <ImageSelector
              currentUrl={imageUrl}
              title={title}
              onSelect={(url) => setImageUrl(url)}
              size="md"
            />
          ) : imageUrl ? (
            <img src={imageUrl} alt="" className="w-full aspect-[3/2] rounded-xl object-cover" />
          ) : (
            <div className="w-full aspect-[3/2] rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
              <img src="/logo-mark.png" alt="" width={48} height={48} style={{ opacity: 0.15 }} />
            </div>
          )}
        </div>
      </div>

      {/* ── CHALLENGE DETAILS ─────────────────────── */}
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">Challenge Details</h3>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-full text-sm font-black font-headline text-white disabled:opacity-40"
              style={{ backgroundColor: "#FF6130" }}
            >
              {saving ? "Saving..." : success ?? "Save Changes"}
            </button>
          )}
        </div>

        {canEdit ? (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Title</label>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl p-3 text-base font-bold font-headline focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What will participants experience?"
                className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none"
                style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl p-2.5 text-sm font-bold font-headline focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }} />
              </div>
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl p-2.5 text-sm font-bold font-headline focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }} />
              </div>
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Price (CHF)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
                  className="w-full rounded-xl p-2.5 text-sm font-bold font-headline focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight mb-3">{challenge.title}</h2>
            {challenge.description && <p className="text-base text-[#334155] mb-4 leading-relaxed">{challenge.description}</p>}
            <div className="flex gap-6 text-base">
              <div>
                <p className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider">Dates</p>
                <p className="font-bold font-headline text-[#0F2229]">{challenge.startDate} → {challenge.endDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider">Price</p>
                <p className="font-bold font-headline text-[#0F2229]">CHF {(challenge.priceCents / 100).toFixed(0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── COLLABORATORS ─────────────────────────── */}
      {(pendingInvites && pendingInvites.length > 0) || (canEdit && isOwner) ? (
        <div className="rounded-2xl infitra-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">
              Collaborators · {cohosts.length + 1 + (pendingInvites?.length ?? 0)}
            </h3>
          </div>

          {/* Pending invites */}
          {pendingInvites && pendingInvites.length > 0 && (
            <div className="space-y-2 mb-4">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: "1px dashed rgba(148,163,184,0.35)", backgroundColor: "rgba(255,255,255,0.5)" }}>
                  {inv.toAvatar ? (
                    <img src={inv.toAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-cyan-700">{inv.toName[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold font-headline text-[#0F2229] truncate">{inv.toName}</p>
                    <p className="text-xs text-[#94a3b8]">⏳ Waiting for response</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invite more — owner only */}
          {canEdit && isOwner && (
            <div className="pt-2">
              <CollabInviteFlow
                existingChallengeId={challenge.id}
                existingCollaboratorIds={[
                  ...cohosts.map((c) => c.id),
                  ...(pendingInvites?.map((p) => p.toId) ?? []),
                ]}
              />
            </div>
          )}
        </div>
      ) : null}

      {/* ── REVENUE SHARE ─────────────────────────── */}
      <div className="rounded-2xl infitra-card p-6">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider mb-5">Revenue Share</h3>

        <div className="flex items-center gap-8 mb-5">
          <ShareDonut size={140} shares={shares} />
          <div className="flex-1 space-y-4">
            {/* Owner */}
            <div className="flex items-center gap-4">
              {ownerProfile.avatar ? (
                <img src={ownerProfile.avatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-lg font-black text-orange-700">{ownerProfile.name[0]}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-lg font-black font-headline text-[#0F2229]">{ownerProfile.name}</p>
                <p className="text-sm font-bold text-[#94a3b8]">Owner</p>
              </div>
              <p className="text-2xl font-black font-headline text-[#FF6130]">{currentOwnerSplit}%</p>
            </div>
            {/* Cohosts */}
            {cohosts.map((c) => {
              const split = cohostSplits[c.id] ?? c.splitPercent;
              return (
                <div key={c.id} className="flex items-center gap-4">
                  {c.avatar ? (
                    <img src={c.avatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                      <span className="text-lg font-black text-cyan-700">{c.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-lg font-black font-headline text-[#0F2229]">{c.name}</p>
                    <p className="text-sm font-bold text-[#94a3b8]">Collaborator</p>
                  </div>
                  <p className="text-2xl font-black font-headline text-[#0891b2]">{split}%</p>
                  {contract && (
                    <span className="text-sm font-bold font-headline shrink-0">
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
              );
            })}
          </div>
        </div>

        {/* Editable sliders (owner, not locked) */}
        {canEdit && cohosts.length > 0 && (
          <div className="pt-5 border-t" style={{ borderColor: "rgba(15,34,41,0.06)" }}>
            <p className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider mb-3">Adjust Splits</p>
            {cohosts.map((c) => {
              const split = cohostSplits[c.id] ?? c.splitPercent;
              return (
                <div key={c.id} className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold font-headline text-[#0F2229] w-32 truncate">{c.name}</span>
                  <input
                    type="range" min={0} max={100} value={split}
                    onChange={(e) => setCohostSplits((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))}
                    onMouseUp={(e) => handleSaveCohostSplit(c.id, Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleSaveCohostSplit(c.id, Number((e.target as HTMLInputElement).value))}
                    className="flex-1 accent-[#9CF0FF]"
                  />
                  <span className="text-lg font-black font-headline text-[#0891b2] w-14 text-right">{split}%</span>
                </div>
              );
            })}
            <p className="text-xs text-[#94a3b8] mt-2">You keep {currentOwnerSplit}% as owner</p>
          </div>
        )}
      </div>

      {/* ── SESSIONS ─────────────────────────────── */}
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">Sessions · {sessions.length}</h3>
          {canEdit && (
            <button onClick={() => setShowAddSession(!showAddSession)} className="text-sm font-black font-headline text-[#FF6130]">
              {showAddSession ? "Cancel" : "+ Add Session"}
            </button>
          )}
        </div>

        {showAddSession && canEdit && (
          <div className="p-5 rounded-xl mb-4 space-y-4" style={{ border: "1px solid rgba(15,34,41,0.08)", backgroundColor: "rgba(255,255,255,0.5)" }}>
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Session Title</label>
              <input
                value={sessTitle} onChange={(e) => setSessTitle(e.target.value)}
                placeholder="e.g. Fat Burner 1"
                className="w-full rounded-xl p-3 text-base font-bold focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Date & Time</label>
                <input type="datetime-local" value={sessDate} onChange={(e) => setSessDate(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }} />
              </div>
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Duration (min)</label>
                <input type="number" value={sessDuration} onChange={(e) => setSessDuration(e.target.value)} min="5" max="480"
                  className="w-full rounded-xl p-3 text-sm focus:outline-none" style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Cover Image (optional)</label>
              <ImageSelector currentUrl={sessImageUrl} title={sessTitle} onSelect={setSessImageUrl} size="sm" />
            </div>
            <button
              onClick={handleAddSession}
              disabled={addingSession || !sessTitle.trim() || !sessDate}
              className="px-5 py-2.5 rounded-full text-sm font-black font-headline text-white disabled:opacity-40"
              style={{ backgroundColor: "#0891b2" }}
            >
              {addingSession ? "Adding..." : "Add Session"}
            </button>
          </div>
        )}

        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((s) => {
              // Candidates for session cohost: challenge owner + challenge cohosts, minus host + existing cohosts
              const existingIds = new Set([s.hostId, ...s.cohosts.map(c => c.id)]);
              const candidates = [
                { id: ownerProfile === null ? "" : "", name: "" }, // placeholder filler
              ].filter(() => false);
              // Build real candidates: owner profile + challenge cohosts
              const allCollabs = [
                { id: s.hostId === challenge.id ? "" : "", name: "" }
              ];
              // Real candidate list
              const candidateList: { id: string; name: string; avatar: string | null }[] = [];
              // Challenge owner is always a candidate (if not already on session)
              // We need challenge.owner_id which is not directly on the challenge prop. Use ownerProfile.name instead.
              // Actually ownerProfile.id isn't in props. Let me use cohosts from the challenge level.
              cohosts.forEach((cc) => {
                if (!existingIds.has(cc.id)) candidateList.push({ id: cc.id, name: cc.name, avatar: cc.avatar });
              });

              return (
                <div key={s.id} className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(15,34,41,0.06)" }}>
                  <div className="flex items-center gap-4">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}>
                        <img src="/logo-mark.png" alt="" width={18} height={18} style={{ opacity: 0.15 }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black font-headline text-[#0F2229] truncate">{s.title}</p>
                      <p className="text-xs font-bold text-[#94a3b8]">
                        {new Date(s.startTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}{s.durationMinutes} min
                      </p>
                    </div>
                    {/* Host + cohosts avatars */}
                    <div className="flex -space-x-2 shrink-0">
                      {s.hostAvatar ? (
                        <img src={s.hostAvatar} alt={s.hostName} title={`${s.hostName} (Host)`} className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid white", zIndex: 10 }} />
                      ) : (
                        <div title={`${s.hostName} (Host)`} className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center" style={{ border: "2px solid white", zIndex: 10 }}>
                          <span className="text-[10px] font-black text-orange-700">{s.hostName[0]}</span>
                        </div>
                      )}
                      {s.cohosts.map((c, idx) => (
                        c.avatar ? (
                          <img key={c.id} src={c.avatar} alt={c.name} title={c.name} className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid white", zIndex: 9 - idx }} />
                        ) : (
                          <div key={c.id} title={c.name} className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center" style={{ border: "2px solid white", zIndex: 9 - idx }}>
                            <span className="text-[10px] font-black text-cyan-700">{c.name[0]}</span>
                          </div>
                        )
                      ))}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-[#94a3b8] hover:text-red-500 shrink-0"
                        title="Delete session"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Host + cohost names + add */}
                  <div className="mt-3 pl-[4.5rem] flex items-center flex-wrap gap-2">
                    <span className="text-xs text-[#94a3b8]">
                      <span className="font-bold text-[#FF6130]">{s.hostName}</span>
                      <span className="text-[10px] uppercase tracking-wider ml-1">Host</span>
                    </span>
                    {s.cohosts.map((c) => (
                      <span key={c.id} className="text-xs text-[#94a3b8] flex items-center gap-1">
                        · <span className="font-bold text-[#0891b2]">{c.name}</span>
                        <span className="text-[10px] uppercase tracking-wider">Cohost</span>
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveSessionCohost(s.id, c.id)}
                            className="text-[#94a3b8] hover:text-red-500 ml-0.5"
                            title="Remove cohost"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </span>
                    ))}
                    {canEdit && candidateList.length > 0 && (
                      <details className="inline-block relative">
                        <summary className="text-xs font-bold font-headline text-[#FF6130] cursor-pointer list-none">+ Add Cohost</summary>
                        <div className="absolute top-full left-0 mt-1 min-w-[200px] rounded-xl shadow-lg z-10 overflow-hidden" style={{ backgroundColor: "white", border: "1px solid rgba(0,0,0,0.08)" }}>
                          {candidateList.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleAddSessionCohost(s.id, c.id)}
                              className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left"
                            >
                              {c.avatar ? (
                                <img src={c.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-black text-cyan-700">{c.name[0]}</span>
                                </div>
                              )}
                              <span className="text-sm font-bold text-[#0F2229]">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8] text-center py-6">No sessions yet. Add your first session above.</p>
        )}
      </div>

      {/* ── CONTRACT ACTIONS ──────────────────────── */}
      <div className="rounded-2xl infitra-card p-6">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {!isLocked && isDraft && isOwner && (
          <div>
            <p className="text-base text-[#64748b] mb-4">
              When you&apos;re happy with everything, lock the terms for your collaborator to review.
            </p>
            <button
              onClick={handleLockTerms}
              disabled={locking || cohosts.length === 0}
              className="px-6 py-3 rounded-full text-white text-base font-black font-headline disabled:opacity-40 w-full"
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
            <p className="text-base text-[#64748b] mb-4">
              Review everything above. When ready, confirm or request changes.
            </p>
            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={confirming}
                className="flex-1 px-6 py-3 rounded-full text-white text-base font-black font-headline disabled:opacity-40" style={{ backgroundColor: "#0891b2" }}>
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
            <p className="text-base text-[#64748b] mb-2">A collaborator requested changes.</p>
            {contract?.declines.map((d) => (
              <p key={d.cohostId} className="text-sm text-red-500 mb-2">
                {cohosts.find((c) => c.id === d.cohostId)?.name}: {d.comment || "No comment provided"}
              </p>
            ))}
            <button onClick={handleReactivate} disabled={locking}
              className="px-6 py-3 rounded-full text-base font-black font-headline text-[#0F2229] disabled:opacity-40 w-full" style={{ border: "1px solid rgba(0,0,0,0.12)" }}>
              {locking ? "..." : "Reactivate Draft"}
            </button>
          </div>
        )}

        {isLocked && allAccepted && isOwner && (
          <div>
            <p className="text-base text-green-600 font-black mb-4">All collaborators confirmed. Ready to publish!</p>
            <button onClick={handlePublish} disabled={publishing}
              className="px-6 py-3 rounded-full text-white text-base font-black font-headline disabled:opacity-40 w-full"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}>
              {publishing ? "Publishing..." : "Publish Challenge"}
            </button>
          </div>
        )}

        {isLocked && allAccepted && !isOwner && (
          <p className="text-base text-green-600 font-black text-center">All confirmed. Waiting for {ownerProfile.name} to publish.</p>
        )}

        {isLocked && !hasDeclines && contract?.acceptances.includes(currentUserId) && !allAccepted && (
          <p className="text-base text-[#0891b2] font-black text-center">You confirmed. Waiting for others.</p>
        )}

        {isLocked && !hasDeclines && isOwner && !allAccepted && (
          <p className="text-base text-[#0891b2] font-black text-center">Contract locked. Waiting for collaborators to confirm.</p>
        )}
      </div>
    </div>
  );
}
