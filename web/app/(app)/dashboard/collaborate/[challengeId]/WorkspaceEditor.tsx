"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShareDonut } from "@/app/components/ShareDonut";
import { ImageSelector } from "@/app/components/ImageSelector";
import { CollabInviteFlow } from "@/app/(app)/dashboard/create/CollabInviteFlow";
import { updateChallenge, publishChallenge, createChallengeSession, updateChallengeSession, removeChallengeSession } from "@/app/actions/challenge";
import { lockTerms, confirmTerms, requestChanges, reactivateDrafting, updateCohostSplit, addSessionCohost, removeSessionCohost } from "@/app/actions/collaboration";
import { ContractCommitmentModal } from "./ContractCommitmentModal";
import { ContractStatusBanner } from "./ContractStatusBanner";

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
  ownerProfile: { id: string; name: string; avatar: string | null; tagline?: string | null; bio?: string | null; username?: string | null };
  ownerSplit: number;
  cohosts: { id: string; name: string; avatar: string | null; tagline?: string | null; username?: string | null; splitPercent: number }[];
  sessions: {
    id: string; title: string; startTime: string; durationMinutes: number;
    hostId: string; hostName: string; hostAvatar?: string | null;
    imageUrl?: string | null;
    cohosts: { id: string; name: string; avatar: string | null; splitPercent: number }[];
  }[];
  pendingInvites?: {
    id: string; toId: string; toName: string; toAvatar: string | null;
    toTagline?: string | null; toUsername?: string | null;
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

  /**
   * Run after any workspace mutation. Refreshes server components AND signals
   * the chat panel to refetch messages so the system log appears immediately
   * for the acting user (the other collaborator picks it up via the chat's
   * Realtime subscription / polling fallback).
   */
  function refreshAfterAction() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("workspace-activity"));
    }
    router.refresh();
  }
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

  // Collaborator profile popover (one open at a time)
  const [openCollaboratorId, setOpenCollaboratorId] = useState<string | null>(null);

  // Add session state
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessTitle, setSessTitle] = useState("");
  const [sessDate, setSessDate] = useState("");
  const [sessDuration, setSessDuration] = useState("60");
  const [sessImageUrl, setSessImageUrl] = useState<string | null>(null);
  const [sessCohostIds, setSessCohostIds] = useState<string[]>([]);
  const [addingSession, setAddingSession] = useState(false);

  // Dirty check: only enable Save when something changed
  const initialPriceStr = challenge.priceCents > 0 ? (challenge.priceCents / 100).toString() : "";
  const isDirty =
    title !== challenge.title ||
    description !== (challenge.description ?? "") ||
    startDate !== challenge.startDate ||
    endDate !== challenge.endDate ||
    price !== initialPriceStr ||
    imageUrl !== challenge.imageUrl;

  const isDraft = challenge.status === "draft";
  const isLocked = !!contract;
  const allAccepted = contract ? cohosts.every((c) => contract.acceptances.includes(c.id)) : false;
  const hasDeclines = contract ? contract.declines.length > 0 : false;
  // Cohorts can now edit broader fields (title, description, dates, price,
  // cover image) while drafting. The activity log makes every change
  // transparent in chat. Backed by the update_challenge_workspace RPC,
  // which permits owner OR cohost and locks down owner_id/status/contract_id.
  const canEditChallenge = isDraft && !isLocked;
  // Anyone in the collaboration can add their own sessions while drafting
  const canAddSession = isDraft && !isLocked;
  // Per-session: only the session host can edit/delete it + manage its cohosts
  const canEditSession = (hostId: string) => isDraft && !isLocked && hostId === currentUserId;
  // Owner-only governance: invite/remove cohosts, adjust splits, lock,
  // publish, delete. Use canManageCollaboration for these gates.
  const canManageCollaboration = isDraft && !isLocked && isOwner;
  // Backwards-compat alias used in a few places where editing is implied
  const canEdit = canEditChallenge;

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
    refreshAfterAction();
  }

  // Cover image is one discrete action — auto-save when it changes from
  // what the server has. Everything else (title/desc/dates/price) uses
  // the explicit Save button so we have one activity log entry per
  // meaningful edit batch, not per field blur.
  useEffect(() => {
    if (!canEditChallenge) return;
    if (imageUrl === challenge.imageUrl) return;
    handleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  async function handleSaveCohostSplit(cohostId: string, newSplit: number) {
    const result = await updateCohostSplit(challenge.id, cohostId, newSplit);
    if (result.error) { setError(result.error); return; }
    setCohostSplits((prev) => ({ ...prev, [cohostId]: newSplit }));
    refreshAfterAction();
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm("Delete this session?")) return;
    setError(null);
    const result = await removeChallengeSession(challenge.id, sessionId);
    if (result?.error) { setError(result.error); return; }
    refreshAfterAction();
  }

  // Inline session editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ title: string; startTime: string; duration: string; imageUrl: string | null }>({
    title: "", startTime: "", duration: "60", imageUrl: null,
  });
  const [savingSession, setSavingSession] = useState(false);

  function startEditSession(s: Props["sessions"][number]) {
    setEditingSessionId(s.id);
    // Convert ISO to local datetime-local format
    const dt = new Date(s.startTime);
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localISO = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditFields({
      title: s.title,
      startTime: localISO,
      duration: String(s.durationMinutes),
      imageUrl: s.imageUrl ?? null,
    });
  }

  async function handleSaveSession(sessionId: string) {
    if (!editFields.title.trim() || !editFields.startTime) return;
    setSavingSession(true); setError(null);
    const result = await updateChallengeSession(
      sessionId,
      editFields.title.trim(),
      new Date(editFields.startTime).toISOString(),
      parseInt(editFields.duration),
      undefined,
      editFields.imageUrl,
      challenge.id,
    );
    setSavingSession(false);
    if (result?.error) { setError(result.error); return; }
    setEditingSessionId(null);
    refreshAfterAction();
  }

  const [openCohostPicker, setOpenCohostPicker] = useState<string | null>(null);
  const [addingCohostFor, setAddingCohostFor] = useState<string | null>(null);

  async function handleAddSessionCohost(sessionId: string, cohostId: string) {
    if (addingCohostFor) return; // prevent double-click while request in flight
    setError(null);
    setAddingCohostFor(sessionId);
    // Pass null — split_percent only matters for standalone session sales,
    // and this session is bundled with the challenge.
    const result = await addSessionCohost(sessionId, cohostId, null, challenge.id);
    setAddingCohostFor(null);
    setOpenCohostPicker(null); // close the picker
    if (result?.error) { setError(result.error); return; }
    refreshAfterAction();
  }

  async function handleRemoveSessionCohost(sessionId: string, cohostId: string) {
    setError(null);
    const result = await removeSessionCohost(sessionId, cohostId, challenge.id);
    if (result?.error) { setError(result.error); return; }
    refreshAfterAction();
  }

  async function handleAddSession() {
    if (!sessTitle.trim() || !sessDate) return;
    setAddingSession(true); setError(null);
    const result = await createChallengeSession(
      challenge.id, sessTitle.trim(), sessDate, parseInt(sessDuration), sessImageUrl
    );
    if (result?.error) { setError(result.error); setAddingSession(false); return; }

    // Add selected cohosts to the new session (host_id = current user, RLS allows it)
    const newSessionId = (result as any).sessionId;
    if (newSessionId && sessCohostIds.length > 0) {
      for (const cohostId of sessCohostIds) {
        const r = await addSessionCohost(newSessionId, cohostId, null, challenge.id);
        if (r?.error) {
          setError(`Session created, but couldn't add cohost: ${r.error}`);
        }
      }
    }

    setSessTitle(""); setSessDate(""); setSessImageUrl(null); setSessCohostIds([]); setShowAddSession(false);
    setAddingSession(false);
    refreshAfterAction();
  }

  async function handleLockTerms() {
    setLocking(true); setError(null);
    const result = await lockTerms(challenge.id);
    if (result.error) { setError(result.error); setLocking(false); return; }
    // No toast: the banner appearing and the envelope tint switching is the
    // visible confirmation. (Leaving the Save pill's `success` state alone.)
    setLocking(false);
    refreshAfterAction();
  }

  // Both binding steps are gated by a deliberate commitment modal. The
  // cohost's Accept flow and the owner's Publish flow share the same
  // modal component — only the copy differs.
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  async function handleConfirm() {
    if (!contract) return;
    setConfirming(true); setError(null);
    const result = await confirmTerms(contract.id);
    if (result.error) { setError(result.error); setConfirming(false); return; }
    setAcceptModalOpen(false);
    // Banner pill flips to "Confirmed" — no toast needed.
    setConfirming(false);
    refreshAfterAction();
  }

  async function handleRequestChanges() {
    if (!contract) return;
    const comment = prompt("What changes would you like? (optional)");
    setConfirming(true); setError(null);
    const result = await requestChanges(contract.id, comment ?? undefined);
    if (result.error) { setError(result.error); setConfirming(false); return; }
    // Banner headline flips to "Contract changes requested" — no toast needed.
    setConfirming(false);
    refreshAfterAction();
  }

  async function handleReactivate() {
    if (!contract) return;
    setLocking(true); setError(null);
    const result = await reactivateDrafting(challenge.id, contract.id);
    if (result.error) { setError(result.error); setLocking(false); return; }
    // Banner disappears and fields become editable — visual state is the
    // confirmation. Don't write into `success` (that's the Save pill's lane).
    setLocking(false);
    refreshAfterAction();
  }

  async function handlePublish() {
    setPublishing(true); setError(null);
    const result = await publishChallenge(challenge.id);
    if (result?.error) { setError(result.error); setPublishing(false); return; }
    // On success publishChallenge redirects via the server action, so we
    // don't need to close the modal or reset state here.
  }

  // Parties shown in the contract status banner. The owner isn't "confirming"
  // the terms the way a cohost does — they authored them and are now holding
  // the publish action, awaiting cohort acceptances. Status reflects that.
  const contractParties = contract
    ? [
        {
          id: ownerProfile.id,
          name: ownerProfile.name,
          avatar: ownerProfile.avatar,
          role: "Owner" as const,
          status: "awaiting" as const,
          statusAt: contract.lockedAt,
        },
        ...cohosts.map((c) => {
          const declineRow = contract.declines.find((d) => d.cohostId === c.id);
          if (declineRow) {
            return {
              id: c.id,
              name: c.name,
              avatar: c.avatar,
              role: "Cohost" as const,
              status: "declined" as const,
              declineComment: declineRow.comment,
            };
          }
          if (contract.acceptances.includes(c.id)) {
            return {
              id: c.id,
              name: c.name,
              avatar: c.avatar,
              role: "Cohost" as const,
              status: "confirmed" as const,
            };
          }
          return {
            id: c.id,
            name: c.name,
            avatar: c.avatar,
            role: "Cohost" as const,
            status: "pending" as const,
          };
        }),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* ── CONTRACT STATUS BANNER (locked only) ─── */}
      {isLocked && contract && (
        <ContractStatusBanner
          ownerName={ownerProfile.name}
          lockedAt={contract.lockedAt}
          parties={contractParties}
          hasDeclines={hasDeclines}
        />
      )}

      {/*
        Contract envelope (locked only). Wraps every section that is part
        of the snapshot under review — cover, details, collaborators,
        revenue, sessions, signing panel — in one softly tinted tray so
        they read as a single document, not a stack of editable cards.
        In draft mode the wrapper is invisible: just space-y-6 between
        children, matching the previous layout.
      */}
      {/* Envelope color reflects the contract state:
          - reviewing / declined → muted slate (paused mood)
          - all signatures in → pale cyan (Infitra's brand cyan, dialled
            down so it doesn't compete with the orange Publish button —
            but clearly shifted from grey so the workspace *feels* ready) */}
      <div
        className={`space-y-6 transition-colors duration-300 ${isLocked ? "rounded-3xl p-5 sm:p-6" : ""}`}
        style={
          isLocked
            ? allAccepted && !hasDeclines
              ? {
                  // Clearly cyan — visibly shifted from the slate "review"
                  // tint so the ready-to-publish state is unmissable at a
                  // glance. Still dialled down vs the bright #9CF0FF so
                  // the Publish CTA stays the dominant orange focal point.
                  backgroundColor: "#A8D5DC",
                  border: "1px solid rgba(8,145,178,0.35)",
                }
              : {
                  backgroundColor: "#D8DEE2",
                  border: "1px solid rgba(15,34,41,0.1)",
                }
            : undefined
        }
      >
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
              disabled={saving || !isDirty}
              className="px-5 py-2 rounded-full text-sm font-black font-headline text-white disabled:opacity-40"
              style={{ backgroundColor: "#FF6130" }}
            >
              {/* Intentional: only short "Saved" belongs in the pill. Other
                  action success messages (reactivate / lock / confirm) are
                  conveyed by the page state changing — they don't write here. */}
              {saving ? "Saving..." : success ?? (isDirty ? "Save Changes" : "Saved")}
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
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">
            Collaborators · {cohosts.length + 1 + (pendingInvites?.length ?? 0)}
          </h3>
          {canManageCollaboration && (
            <div className="shrink-0">
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

        {/* Inline collaborator chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Owner */}
          <CollaboratorChip
            id={ownerProfile.id}
            name={ownerProfile.name}
            avatar={ownerProfile.avatar}
            tagline={ownerProfile.tagline ?? null}
            bio={ownerProfile.bio ?? null}
            username={ownerProfile.username ?? null}
            role="Owner"
            roleColor="#FF6130"
            open={openCollaboratorId === ownerProfile.id}
            onToggle={() => setOpenCollaboratorId(openCollaboratorId === ownerProfile.id ? null : ownerProfile.id)}
            onClose={() => setOpenCollaboratorId(null)}
          />
          {/* Confirmed cohosts */}
          {cohosts.map((c) => (
            <CollaboratorChip
              key={c.id}
              id={c.id}
              name={c.name}
              avatar={c.avatar}
              tagline={c.tagline ?? null}
              bio={null}
              username={c.username ?? null}
              role="Cohost"
              roleColor="#0891b2"
              open={openCollaboratorId === c.id}
              onToggle={() => setOpenCollaboratorId(openCollaboratorId === c.id ? null : c.id)}
              onClose={() => setOpenCollaboratorId(null)}
            />
          ))}
          {/* Pending invites */}
          {pendingInvites?.map((inv) => (
            <CollaboratorChip
              key={inv.id}
              id={inv.toId}
              name={inv.toName}
              avatar={inv.toAvatar}
              tagline={inv.toTagline ?? null}
              bio={null}
              username={inv.toUsername ?? null}
              role="Pending"
              roleColor="#94a3b8"
              dashed
              open={openCollaboratorId === inv.toId}
              onToggle={() => setOpenCollaboratorId(openCollaboratorId === inv.toId ? null : inv.toId)}
              onClose={() => setOpenCollaboratorId(null)}
            />
          ))}
        </div>
      </div>

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
                  {/* Acceptance status lives in the top Contract Status Banner now
                      — chips stay about identity + split only. */}
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue split sliders — owner only (governance) */}
        {canManageCollaboration && cohosts.length > 0 && (
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
          {canAddSession && (
            <button onClick={() => setShowAddSession(!showAddSession)} className="text-sm font-black font-headline text-[#FF6130]">
              {showAddSession ? "Cancel" : "+ Add Session"}
            </button>
          )}
        </div>

        {showAddSession && canAddSession && (
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

            {/* Cohost selector — pick from challenge collaborators (you'll be the host since you create the session) */}
            {(() => {
              // Candidates: challenge owner + all challenge cohosts, minus the creator (who becomes host)
              const candidates: { id: string; name: string; avatar: string | null }[] = [];
              if (ownerProfile.id !== currentUserId) {
                candidates.push({ id: ownerProfile.id, name: ownerProfile.name, avatar: ownerProfile.avatar });
              }
              cohosts.forEach((c) => {
                if (c.id !== currentUserId) candidates.push({ id: c.id, name: c.name, avatar: c.avatar });
              });
              if (candidates.length === 0) return null;
              return (
                <div>
                  <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">
                    Cohosts (optional) — you&apos;ll be the host
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {candidates.map((c) => {
                      const selected = sessCohostIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSessCohostIds(
                            selected
                              ? sessCohostIds.filter((id) => id !== c.id)
                              : [...sessCohostIds, c.id]
                          )}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-headline transition-all"
                          style={{
                            backgroundColor: selected ? "rgba(156,240,255,0.20)" : "rgba(0,0,0,0.03)",
                            border: selected ? "1px solid #0891b2" : "1px solid rgba(15,34,41,0.08)",
                            color: selected ? "#0891b2" : "#64748b",
                          }}
                        >
                          {c.avatar ? (
                            <img src={c.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                              <span className="text-[9px] font-black text-cyan-700">{c.name[0]}</span>
                            </div>
                          )}
                          {c.name}
                          {selected && <span className="text-[9px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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
              // Candidate list = challenge owner + all challenge cohosts, minus session host & existing session cohosts
              const candidateList: { id: string; name: string; avatar: string | null }[] = [];
              if (!existingIds.has(ownerProfile.id)) {
                candidateList.push({ id: ownerProfile.id, name: ownerProfile.name, avatar: ownerProfile.avatar });
              }
              cohosts.forEach((cc) => {
                if (!existingIds.has(cc.id)) candidateList.push({ id: cc.id, name: cc.name, avatar: cc.avatar });
              });

              return (
                <div key={s.id} className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(15,34,41,0.06)" }}>
                  {editingSessionId === s.id ? (
                    /* INLINE EDIT MODE */
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Title</label>
                        <input
                          value={editFields.title}
                          onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                          className="w-full rounded-xl p-2.5 text-sm font-bold focus:outline-none"
                          style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Date & Time</label>
                          <input
                            type="datetime-local"
                            value={editFields.startTime}
                            onChange={(e) => setEditFields({ ...editFields, startTime: e.target.value })}
                            className="w-full rounded-xl p-2.5 text-sm focus:outline-none"
                            style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Duration (min)</label>
                          <input
                            type="number" min={5} max={480}
                            value={editFields.duration}
                            onChange={(e) => setEditFields({ ...editFields, duration: e.target.value })}
                            className="w-full rounded-xl p-2.5 text-sm focus:outline-none"
                            style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">Cover Image (optional)</label>
                        <ImageSelector currentUrl={editFields.imageUrl} title={editFields.title} onSelect={(url) => setEditFields({ ...editFields, imageUrl: url })} size="sm" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveSession(s.id)}
                          disabled={savingSession || !editFields.title.trim() || !editFields.startTime}
                          className="px-4 py-2 rounded-full text-xs font-black font-headline text-white disabled:opacity-40"
                          style={{ backgroundColor: "#FF6130" }}
                        >
                          {savingSession ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="px-4 py-2 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]"
                          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* DISPLAY MODE */
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
                        <p className="text-xs font-bold text-[#94a3b8]" suppressHydrationWarning>
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
                      {/* Edit + delete only for the session host (or owner can also delete) */}
                      {canEditSession(s.hostId) && (
                        <button
                          onClick={() => startEditSession(s)}
                          className="text-[#94a3b8] hover:text-[#FF6130] shrink-0"
                          title="Edit session"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      {/* Delete: session host OR challenge owner (matches RPC authz) */}
                      {(canEditSession(s.hostId) || canManageCollaboration) && (
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
                  )}

                  {/* Host + cohost names + add (hidden in edit mode) */}
                  {editingSessionId !== s.id && (
                  <div className="mt-3 pl-[4.5rem] flex items-center flex-wrap gap-2">
                    <span className="text-xs text-[#94a3b8]">
                      <span className="font-bold text-[#FF6130]">{s.hostName}</span>
                      <span className="text-[10px] uppercase tracking-wider ml-1">Host</span>
                    </span>
                    {s.cohosts.map((c) => (
                      <span key={c.id} className="text-xs text-[#94a3b8] flex items-center gap-1">
                        · <span className="font-bold text-[#0891b2]">{c.name}</span>
                        <span className="text-[10px] uppercase tracking-wider">Cohost</span>
                        {canEditSession(s.hostId) && (
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
                    {canEditSession(s.hostId) && candidateList.length > 0 && (
                      <div className="inline-block relative">
                        <button
                          onClick={() => setOpenCohostPicker(openCohostPicker === s.id ? null : s.id)}
                          className="text-xs font-bold font-headline text-[#FF6130] cursor-pointer"
                        >
                          + Add Cohost
                        </button>
                        {openCohostPicker === s.id && (
                          <div className="absolute top-full left-0 mt-1 min-w-[200px] rounded-xl shadow-lg z-10 overflow-hidden" style={{ backgroundColor: "white", border: "1px solid rgba(0,0,0,0.08)" }}>
                            {candidateList.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => handleAddSessionCohost(s.id, c.id)}
                                disabled={addingCohostFor === s.id}
                                className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left disabled:opacity-40"
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
                        )}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8] text-center py-6">No sessions yet. Add your first session above.</p>
        )}
      </div>

      {/* ── SIGNING / ACTION PANEL ───────────────────
          Responsibilities split with the top banner:
          - Banner = status + process context (who signed, freeze/reset rules)
          - This panel = the single actionable next step for the current viewer
          Verbiage about the contract process lives in the banner and the chat
          log; this panel stays lean and action-focused. */}
      <div className="rounded-2xl infitra-card p-6">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {/* Drafting: owner can lock once there's at least one cohost AND no
            unsaved changes. Locking snapshots the DB state — if we let the
            owner lock with a dirty form, their in-progress edits would be
            silently discarded. */}
        {!isLocked && isDraft && isOwner && (
          <div>
            <p className="text-base text-[#64748b] mb-4">
              When you&apos;re happy with everything, lock the terms for your collaborator to review.
            </p>
            <button
              onClick={handleLockTerms}
              disabled={locking || cohosts.length === 0 || isDirty}
              className="px-6 py-3 rounded-full text-white text-base font-black font-headline disabled:opacity-40 w-full"
              style={{ backgroundColor: "#0891b2" }}
            >
              {locking ? "Locking..." : "Lock Terms for Review"}
            </button>
            {isDirty && (
              <p className="text-xs font-bold text-[#FF6130] text-center mt-3">
                Save your changes before locking.
              </p>
            )}
            {!isDirty && cohosts.length === 0 && (
              <p className="text-xs font-bold text-[#94a3b8] text-center mt-3">
                Invite at least one collaborator before locking.
              </p>
            )}
          </div>
        )}

        {/* Drafting: cohost just waits */}
        {!isLocked && isDraft && !isOwner && (
          <p className="text-sm text-[#94a3b8] text-center">
            Waiting for {ownerProfile.name} to finalize and lock terms.
          </p>
        )}

        {/* Locked, cohost hasn't acted yet: accept (via modal) or request changes */}
        {isLocked && !hasDeclines && !isOwner && !contract?.acceptances.includes(currentUserId) && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setAcceptModalOpen(true)}
              disabled={confirming}
              className="flex-1 px-6 py-3 rounded-full text-white text-base font-black font-headline disabled:opacity-40"
              style={{ backgroundColor: "#0891b2" }}
            >
              Accept Terms
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
        )}

        {/* Locked, cohost already confirmed, waiting for the rest */}
        {isLocked && !hasDeclines && !isOwner && contract?.acceptances.includes(currentUserId) && !allAccepted && (
          <p className="text-sm text-[#94a3b8] text-center">
            You&apos;ve accepted. Waiting on the remaining collaborators.
          </p>
        )}

        {/* Locked, someone declined — only the owner can reactivate */}
        {isLocked && hasDeclines && isOwner && (
          <button
            onClick={handleReactivate}
            disabled={locking}
            className="px-6 py-3 rounded-full text-base font-black font-headline text-[#0F2229] disabled:opacity-40 w-full"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }}
          >
            {locking ? "..." : "Reopen Draft"}
          </button>
        )}

        {/* Locked, someone declined — non-owner can't act */}
        {isLocked && hasDeclines && !isOwner && (
          <p className="text-sm text-[#94a3b8] text-center">
            Waiting for {ownerProfile.name} to reopen the draft.
          </p>
        )}

        {/* Locked, all accepted, owner publishes — primary CTA, plus a
            de-emphasised escape hatch to reopen the draft. Even at this
            stage the owner should have a way out; it just shouldn't
            compete with Publish visually. */}
        {isLocked && allAccepted && isOwner && (
          <div className="space-y-3">
            <button
              onClick={() => setPublishModalOpen(true)}
              disabled={publishing}
              className="px-6 py-3 rounded-full text-white text-base font-black font-headline disabled:opacity-40 w-full"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
            >
              {publishing ? "Publishing..." : "Publish Challenge"}
            </button>
            <button
              onClick={handleReactivate}
              disabled={locking || publishing}
              className="block mx-auto text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-40"
            >
              {locking ? "…" : "Reopen draft to edit"}
            </button>
          </div>
        )}

        {/* Locked, all accepted, waiting for owner */}
        {isLocked && allAccepted && !isOwner && (
          <p className="text-sm text-[#94a3b8] text-center">
            All signatures in. Waiting for {ownerProfile.name} to publish.
          </p>
        )}

        {/* Locked, owner with still-pending cohosts — can wait, or reopen
            the draft if they spot something to change. Reopening clears
            any acceptances that already came in (see banner copy). */}
        {isLocked && !hasDeclines && isOwner && !allAccepted && (
          <div className="space-y-3">
            <p className="text-sm text-[#94a3b8] text-center">
              Waiting for the remaining collaborators to accept.
            </p>
            <button
              onClick={handleReactivate}
              disabled={locking}
              className="px-6 py-3 rounded-full text-base font-black font-headline text-[#0F2229] disabled:opacity-40 w-full"
              style={{ border: "1px solid rgba(0,0,0,0.12)" }}
            >
              {locking ? "..." : "Reopen Draft"}
            </button>
          </div>
        )}
      </div>

      {/* end of contract envelope */}
      </div>

      {/* Cohost acceptance — signature moment #1. */}
      <ContractCommitmentModal
        open={acceptModalOpen}
        title="Accept the collaboration terms?"
        introLine="By accepting, you commit to the following:"
        bullets={[
          "You agree to fulfill your contributions as stated.",
          <>You are authorising <span className="font-bold">{ownerProfile.name}</span> to publish this collaboration.</>,
          "Once published, the terms are binding for everyone.",
        ]}
        checkboxLabel="I've reviewed the terms and accept them."
        confirmLabel="Accept Terms"
        submittingLabel="Accepting…"
        submitting={confirming}
        onConfirm={handleConfirm}
        onCancel={() => setAcceptModalOpen(false)}
      />

      {/* Owner publish — signature moment #2. Parallel structure to the
          cohost's accept flow: same gravity, same friction level, owner
          perspective. */}
      <ContractCommitmentModal
        open={publishModalOpen}
        title="Publish the collaboration?"
        introLine="By publishing, you commit to the following:"
        bullets={[
          "You agree to fulfill your contributions as stated.",
          "You are making the collaboration live with the accepted terms.",
          "Once published, the terms are binding for everyone — including you.",
        ]}
        checkboxLabel="I've reviewed the final terms and publish the collaboration."
        confirmLabel="Publish Collaboration"
        submittingLabel="Publishing…"
        submitting={publishing}
        onConfirm={handlePublish}
        onCancel={() => setPublishModalOpen(false)}
      />
    </div>
  );
}

/* ── CollaboratorChip — clickable avatar+name with profile popover ─────── */
function CollaboratorChip({
  id, name, avatar, tagline, bio, username, role, roleColor, dashed, open, onToggle, onClose,
}: {
  id: string;
  name: string;
  avatar: string | null;
  tagline: string | null;
  bio: string | null;
  username: string | null;
  role: string;
  roleColor: string;
  dashed?: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:shadow-sm"
        style={{
          backgroundColor: "rgba(255,255,255,0.5)",
          border: dashed
            ? `1px dashed ${roleColor}66`
            : `1px solid rgba(15,34,41,0.08)`,
        }}
      >
        {avatar ? (
          <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${roleColor}20` }}>
            <span className="text-[11px] font-black" style={{ color: roleColor }}>{name[0]}</span>
          </div>
        )}
        <div className="text-left">
          <span className="text-sm font-bold font-headline text-[#0F2229] block leading-none">{name}</span>
          <span className="text-[10px] font-bold font-headline uppercase tracking-wider" style={{ color: roleColor }}>{role}</span>
        </div>
      </button>

      {open && (
        <>
          {/* Click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={onClose} />
          {/* Popover */}
          <div
            className="absolute top-full left-0 mt-2 w-72 rounded-2xl shadow-xl z-50 overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                {avatar ? (
                  <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${roleColor}20` }}>
                    <span className="text-lg font-black" style={{ color: roleColor }}>{name[0]}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-black font-headline text-[#0F2229] truncate">{name}</p>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider" style={{ color: roleColor }}>{role}</p>
                </div>
              </div>
              {tagline && (
                <p className="text-sm font-bold text-[#334155] mb-2 leading-snug">{tagline}</p>
              )}
              {bio && (
                <p className="text-xs text-[#64748b] leading-relaxed line-clamp-3">{bio}</p>
              )}
              {username && (
                <a
                  href={`/creators/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-xs font-bold font-headline text-[#FF6130] hover:opacity-80"
                >
                  View full profile →
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
