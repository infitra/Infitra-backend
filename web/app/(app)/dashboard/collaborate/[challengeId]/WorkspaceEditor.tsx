"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ImageSelector } from "@/app/components/ImageSelector";
import { Dialog } from "@/app/components/Dialog";
import {
  updateChallenge,
  publishChallenge,
  createChallengeSession,
  updateChallengeSession,
  removeChallengeSession,
} from "@/app/actions/challenge";
import {
  lockTerms,
  confirmTerms,
  requestChanges,
  reactivateDrafting,
  updateCohostSplit,
  removeCohost,
  addSessionCohost,
  removeSessionCohost,
} from "@/app/actions/collaboration";
import { ContractCommitmentModal } from "./ContractCommitmentModal";
import { ContractStatusBanner } from "./ContractStatusBanner";
import { SessionDetailModal } from "./SessionDetailModal";
import { PromiseEditor } from "./PromiseEditor";
import { IntroPromptEditor } from "./IntroPromptEditor";
import { TeamSection, type CreatorRow, type PendingInviteRow } from "./TeamSection";
import {
  ProgramRhythmSection,
  type WeeklyFocusEntry,
} from "./ProgramRhythmSection";
import { SaveStatusPill } from "./SaveStatusPill";
import { useSaveStatus } from "./useSaveStatus";
import { useSyncedField, type ActivityRow } from "./useWorkspaceRealtime";
import { SectionAttribution } from "./SectionAttribution";

interface TopicOwnershipEntry {
  creator_id: string;
  topics: string[];
}

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
    promiseText: string | null;
    weeklyArc: WeeklyFocusEntry[];
    topicOwnership: TopicOwnershipEntry[];
    introPrompt: string | null;
    promiseEditedAt: string | null;
    promiseEditorName: string | null;
  };
  isOwner: boolean;
  currentUserId: string;
  ownerProfile: {
    id: string;
    name: string;
    avatar: string | null;
    tagline?: string | null;
    bio?: string | null;
    username?: string | null;
  };
  ownerSplit: number;
  cohosts: {
    id: string;
    name: string;
    avatar: string | null;
    tagline?: string | null;
    bio?: string | null;
    username?: string | null;
    splitPercent: number;
  }[];
  sessions: {
    id: string;
    title: string;
    startTime: string;
    durationMinutes: number;
    hostId: string;
    hostName: string;
    hostAvatar?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    cohosts: { id: string; name: string; avatar: string | null; splitPercent: number }[];
  }[];
  pendingInvites?: {
    id: string;
    toId: string;
    toName: string;
    toAvatar: string | null;
    toTagline?: string | null;
    toUsername?: string | null;
    splitPercent: number;
    message: string;
  }[];
  contract: {
    id: string;
    lockedAt: string;
    acceptances: string[];
    declines: { cohostId: string; comment: string | null }[];
  } | null;
  /** Bundle 3 polish — workspace activity log, kept fresh by Realtime. */
  activity: ActivityRow[];
  /** Bundle 3 polish — profile lookup for SectionAttribution chips. */
  profileMap: Record<string, { name: string; avatar: string | null }>;
}

const DETAILS_ATTRIBUTION_FIELDS = [
  "title",
  "description",
  "start_date",
  "end_date",
  "price",
  "image_url",
  "capacity",
  "challenge_details",
];

export function WorkspaceEditor({
  challenge,
  isOwner,
  currentUserId,
  ownerProfile,
  ownerSplit,
  cohosts,
  sessions,
  pendingInvites,
  contract,
  activity,
  profileMap,
}: Props) {
  const router = useRouter();
  const { status: saveStatus, runSave } = useSaveStatus();

  const [error, setError] = useState<string | null>(null);

  // ── Editable fields, with local-wins sync against partner saves ──
  const [title, setTitle, markTitleSaved] = useSyncedField(challenge.title);
  const [description, setDescription, markDescriptionSaved] = useSyncedField(challenge.description ?? "");
  const [startDate, setStartDate, markStartDateSaved] = useSyncedField(challenge.startDate);
  // Duration is the primary input (weeks), end_date is derived. Programs
  // are sold as "6 weeks" — letting the creator pick a non-whole-week
  // calendar range would break that promise. Initial value derived from
  // the existing start/end, rounded to nearest whole week (handles legacy
  // data; new programs always start as exact weeks).
  const initialDurationWeeks = computeWeeksBetween(challenge.startDate, challenge.endDate);
  const [durationWeeks, setDurationWeeks, markDurationSaved] = useSyncedField(initialDurationWeeks);
  // Derived end_date — recomputed whenever startDate or durationWeeks changes.
  const derivedEndDate = useMemo(
    () => computeEndDate(startDate, durationWeeks),
    [startDate, durationWeeks],
  );

  // Polish v12.J: sessions are guard-railed to fall within the program's
  // [start_date 00:00 local, end_date 23:59 local] window. These bounds
  // drive (a) the `min` / `max` attributes on the session datetime
  // inputs so the picker physically can't reach out-of-range dates, and
  // (b) a local validator that disables Save + shows an inline error
  // if the value is somehow out of range (typed in manually, or the
  // program dates changed after a session was created).
  const sessionMinDateTime = startDate ? `${startDate}T00:00` : undefined;
  const sessionMaxDateTime = derivedEndDate ? `${derivedEndDate}T23:59` : undefined;

  function isSessionDateOutOfRange(localDateTime: string): boolean {
    if (!localDateTime || !startDate || !derivedEndDate) return false;
    const value = new Date(localDateTime).getTime();
    if (Number.isNaN(value)) return false;
    // Local-midnight for start; local end-of-day for end (sessions ON
    // the end_date are valid until 23:59:59.999 that day).
    const min = new Date(`${startDate}T00:00:00`).getTime();
    const max = new Date(`${derivedEndDate}T23:59:59.999`).getTime();
    return value < min || value > max;
  }

  const sessionRangeLabel = useMemo(() => {
    if (!startDate || !derivedEndDate) return null;
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${fmt(startDate)} – ${fmt(derivedEndDate)}`;
  }, [startDate, derivedEndDate]);

  // Polish v12.L.2: split the single datetime-local field into two
  // separate Date + Start time inputs for clearer affordances (the
  // native datetime-local widget looks like one field but contains
  // two pickers, which users miss). Internal state stays as the
  // combined `YYYY-MM-DDTHH:MM` ISO string so the save handler and
  // range validator don't need to change — these helpers just edit
  // one half of the ISO string at a time.
  function splitIso(iso: string): { date: string; time: string } {
    if (!iso) return { date: "", time: "" };
    const [d = "", t = ""] = iso.split("T");
    return { date: d, time: t };
  }
  function setDatePart(setter: (next: string) => void, currentIso: string, newDate: string) {
    const { time } = splitIso(currentIso);
    if (!newDate) { setter(""); return; }
    setter(`${newDate}T${time || "19:00"}`);
  }
  function setTimePart(setter: (next: string) => void, currentIso: string, newTime: string) {
    const { date } = splitIso(currentIso);
    if (!date) return; // can't set a time without a date
    setter(`${date}T${newTime || "19:00"}`);
  }
  const [price, setPrice, markPriceSaved] = useSyncedField(
    challenge.priceCents > 0 ? (challenge.priceCents / 100).toString() : "",
  );
  const [imageUrl, setImageUrl, markImageSaved] = useSyncedField(challenge.imageUrl);

  const [promiseText, setPromiseText, markPromiseSaved] = useSyncedField(challenge.promiseText ?? "");
  const [introPrompt, setIntroPrompt, markIntroSaved] = useSyncedField(challenge.introPrompt ?? "");
  const [weeklyArc, setWeeklyArc, markWeeklyArcSaved] = useSyncedField<WeeklyFocusEntry[]>(challenge.weeklyArc);
  const [topicOwnership, setTopicOwnership, markTopicOwnershipSaved] = useSyncedField<TopicOwnershipEntry[]>(challenge.topicOwnership);

  // Topics map per creator for fast lookup
  const topicsByCreator: Record<string, string[]> = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const entry of topicOwnership) {
      out[entry.creator_id] = entry.topics;
    }
    return out;
  }, [topicOwnership]);

  // Session counts per creator (for the Team section "X sessions" chip)
  const sessionCountByCreator: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sessions) {
      counts[s.hostId] = (counts[s.hostId] ?? 0) + 1;
    }
    return counts;
  }, [sessions]);

  // ── Cover image: still uses an explicit auto-save effect since the
  //    ImageSelector commits in one shot rather than on blur.
  useEffect(() => {
    if (!canEditChallenge()) return;
    if (imageUrl === challenge.imageUrl) return;
    void saveField("image_url", { image_url: imageUrl ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // ── Session add/edit state (preserved from prior version) ──
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessTitle, setSessTitle] = useState("");
  const [sessDate, setSessDate] = useState("");
  const [sessDuration, setSessDuration] = useState("60");
  const [sessImageUrl, setSessImageUrl] = useState<string | null>(null);
  const [sessDescription, setSessDescription] = useState("");
  const [sessCohostIds, setSessCohostIds] = useState<string[]>([]);
  const [addingSession, setAddingSession] = useState(false);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{
    title: string;
    startTime: string;
    duration: string;
    imageUrl: string | null;
    description: string;
  }>({ title: "", startTime: "", duration: "60", imageUrl: null, description: "" });
  const [savingSession, setSavingSession] = useState(false);
  const [openCohostPicker, setOpenCohostPicker] = useState<string | null>(null);
  const [addingCohostFor, setAddingCohostFor] = useState<string | null>(null);

  // ── Contract / signing state ──
  const [locking, setLocking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<Props["sessions"][number] | null>(null);

  const isDraft = challenge.status === "draft";
  const isLocked = !!contract;
  const isPublished = challenge.status === "published";
  const allAccepted = contract ? cohosts.every((c) => contract.acceptances.includes(c.id)) : false;
  const hasDeclines = contract ? contract.declines.length > 0 : false;
  const hasContractDoc = !!contract;

  function canEditChallenge() {
    return isDraft && !isLocked;
  }
  const canEdit = canEditChallenge();
  const canAddSession = canEdit;
  const canEditSession = (hostId: string) => canEdit && hostId === currentUserId;
  const canManageCollaboration = canEdit && isOwner;

  // Polish v12.U.1: hard guard for every commit handler. Even if
  // realtime hasn't repainted the UI to read-only mode yet, this
  // blocks the save and surfaces an immediate error so the user
  // knows their change can't go through. Belt-and-suspenders with
  // the per-editor `canEdit` prop.
  function assertEditable(): boolean {
    if (isLocked) {
      setError("Terms are locked for review. Reopen the draft to make changes.");
      return false;
    }
    if (!isDraft) {
      setError("Program is no longer in draft.");
      return false;
    }
    return true;
  }

  // After any mutation: refresh server props + signal the chat to refetch.
  function refreshAfterAction() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("workspace-activity"));
    }
    router.refresh();
  }

  // ── Per-field auto-save ─────────────────────────────────────────
  // The RPC takes the whole challenge state on every call (Bundle 2
  // schema), so each field-blur sends every field's CURRENT value plus
  // a `changed_field` hint that drives the activity log + per-section
  // attribution chips. The useSaveStatus hook discards stale responses
  // via its sequence counter so slow connections don't flicker.

  type Override = Partial<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    price: string;
    image_url: string | null;
    promise_text: string;
    weekly_arc: WeeklyFocusEntry[];
    topic_ownership: TopicOwnershipEntry[];
    intro_prompt: string;
  }>;

  async function saveField(fieldName: string, override: Override = {}) {
    if (!assertEditable()) return;
    setError(null);
    const formData = new FormData();
    formData.set("challenge_id", challenge.id);
    formData.set("title", override.title ?? title);
    formData.set("description", override.description ?? description);
    formData.set("start_date", override.start_date ?? startDate);
    // end_date is derived from start_date + durationWeeks; the override
    // can carry an explicit value (for example when commitStartDate
    // bumps it forward in lock-step).
    formData.set("end_date", override.end_date ?? derivedEndDate);
    formData.set("price", override.price ?? price);
    const img = override.image_url !== undefined ? override.image_url : imageUrl;
    if (img !== null && img !== undefined) {
      formData.set("image_url", img);
    } else {
      formData.set("image_url", "");
    }
    formData.set("promise_text", override.promise_text ?? promiseText);
    formData.set(
      "weekly_arc",
      JSON.stringify(override.weekly_arc ?? weeklyArc ?? []),
    );
    formData.set(
      "topic_ownership",
      JSON.stringify(override.topic_ownership ?? topicOwnership ?? []),
    );
    formData.set("intro_prompt", override.intro_prompt ?? introPrompt);
    formData.set("changed_field", fieldName);

    const result = await runSave(() => updateChallenge(null, formData));
    if (result?.error) {
      setError(result.error);
      return;
    }
    refreshAfterAction();
  }

  // Per-field commit handlers — called on blur. Each one:
  //   1. Skips if the value didn't change (no save needed)
  //   2. Validates inline if needed (returns early on bad input)
  //   3. Calls saveField with the right field name + override (fresh value)
  //   4. Marks the field "saved" so the next prop update from a partner
  //      can flow through (useSyncedField gates on dirty).

  async function commitTitle() {
    const trimmed = title.trim();
    if (trimmed === challenge.title) { markTitleSaved(); return; }
    if (trimmed.length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    setTitle(trimmed);
    await saveField("title", { title: trimmed });
    markTitleSaved();
  }

  async function commitDescription() {
    if (description === (challenge.description ?? "")) { markDescriptionSaved(); return; }
    await saveField("description", { description });
    markDescriptionSaved();
  }

  async function commitStartDate() {
    if (startDate === challenge.startDate) { markStartDateSaved(); return; }
    if (!startDate) { setError("Start date is required."); return; }
    if (new Date(startDate) <= new Date()) {
      setError("Start date must be in the future.");
      return;
    }
    // When start moves, end_date moves with it (in lock-step, preserving
    // the duration in weeks). Send both in one save so the pair is
    // always consistent server-side.
    const newEndDate = computeEndDate(startDate, durationWeeks);
    await saveField("start_date", { start_date: startDate, end_date: newEndDate });
    markStartDateSaved();
  }

  async function commitDurationWeeks() {
    if (durationWeeks === initialDurationWeeks) { markDurationSaved(); return; }
    if (durationWeeks < 1 || durationWeeks > 52) {
      setError("Duration must be between 1 and 52 weeks.");
      return;
    }
    const newEndDate = computeEndDate(startDate, durationWeeks);
    await saveField("weeks", { end_date: newEndDate });
    markDurationSaved();
  }

  async function commitPrice() {
    const initial = challenge.priceCents > 0 ? (challenge.priceCents / 100).toString() : "";
    if (price === initial) { markPriceSaved(); return; }
    const cents = price ? Math.round(parseFloat(price) * 100) : 0;
    if (cents < 0) { setError("Price cannot be negative."); return; }
    await saveField("price", { price });
    markPriceSaved();
  }

  async function commitPromise() {
    if (promiseText === (challenge.promiseText ?? "")) { markPromiseSaved(); return; }
    await saveField("promise_text", { promise_text: promiseText });
    markPromiseSaved();
  }

  async function commitIntro() {
    if (introPrompt === (challenge.introPrompt ?? "")) { markIntroSaved(); return; }
    await saveField("intro_prompt", { intro_prompt: introPrompt });
    markIntroSaved();
  }

  async function commitWeeklyFocus(weekNum: number, theme: string) {
    // durationWeeks is the canonical week count now (no more derived
    // computation from end_date). Build the full row set 1..durationWeeks
    // preserving existing themes.
    const fullRows: WeeklyFocusEntry[] = [];
    for (let w = 1; w <= durationWeeks; w++) {
      if (w === weekNum) {
        fullRows.push({ week: w, theme });
      } else {
        const existing = weeklyArc.find((e) => e.week === w);
        fullRows.push({ week: w, theme: existing?.theme ?? "" });
      }
    }
    setWeeklyArc(fullRows);
    await saveField("weekly_focus", { weekly_arc: fullRows });
    markWeeklyArcSaved();
  }

  async function commitTopics(creatorId: string, topics: string[]) {
    const next = topicOwnership.filter((e) => e.creator_id !== creatorId);
    if (topics.length > 0) {
      next.push({ creator_id: creatorId, topics });
    }
    setTopicOwnership(next);
    await saveField("topic_ownership", { topic_ownership: next });
    markTopicOwnershipSaved();
  }

  async function commitCohostSplit(cohostId: string, splitPercent: number) {
    if (!assertEditable()) return;
    setError(null);
    // updateCohostSplit is a separate action targeting app_challenge_cohost
    // directly; it logs its own field_edit ('cohost_split') via the
    // collaboration.ts logWorkspaceFieldEdit helper.
    const result = await runSave(() => updateCohostSplit(challenge.id, cohostId, splitPercent));
    if (result?.error) { setError(result.error); return; }
    refreshAfterAction();
  }

  async function commitCohostRemove(cohostId: string) {
    if (!assertEditable()) return;
    setError(null);
    const result = await runSave(() => removeCohost(challenge.id, cohostId));
    if (result?.error) { setError(result.error); return; }
    // Refresh local state immediately. The Realtime DELETE event on
    // app_challenge_cohost will also fire on the partner's side and
    // refresh their view via useWorkspaceRealtime.
    refreshAfterAction();
  }

  // ── Session handlers (unchanged from prior version, just preserved) ──

  async function handleDeleteSession(sessionId: string) {
    if (!assertEditable()) return;
    if (!confirm("Delete this session?")) return;
    setError(null);
    const result = await runSave(() => removeChallengeSession(challenge.id, sessionId));
    if (result?.error) { setError(result.error); return; }
    refreshAfterAction();
  }

  function startEditSession(s: Props["sessions"][number]) {
    setEditingSessionId(s.id);
    const dt = new Date(s.startTime);
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localISO = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditFields({
      title: s.title,
      startTime: localISO,
      duration: String(s.durationMinutes),
      imageUrl: s.imageUrl ?? null,
      description: s.description ?? "",
    });
  }

  async function handleSaveSession(sessionId: string) {
    if (!assertEditable()) return;
    if (!editFields.title.trim() || !editFields.startTime) return;
    if (isSessionDateOutOfRange(editFields.startTime)) {
      setError(`Session must fall within the program window (${sessionRangeLabel ?? ""}).`);
      return;
    }
    setSavingSession(true);
    setError(null);
    const result = await updateChallengeSession(
      sessionId,
      editFields.title.trim(),
      new Date(editFields.startTime).toISOString(),
      parseInt(editFields.duration),
      editFields.description.trim() || null,
      editFields.imageUrl,
      challenge.id,
    );
    setSavingSession(false);
    if (result?.error) { setError(result.error); return; }
    setEditingSessionId(null);
    refreshAfterAction();
  }

  async function handleAddSessionCohost(sessionId: string, cohostId: string) {
    if (!assertEditable()) return;
    if (addingCohostFor) return;
    setError(null);
    setAddingCohostFor(sessionId);
    const result = await addSessionCohost(sessionId, cohostId, null, challenge.id);
    setAddingCohostFor(null);
    setOpenCohostPicker(null);
    if (result?.error) { setError(result.error); return; }
    refreshAfterAction();
  }

  async function handleRemoveSessionCohost(sessionId: string, cohostId: string) {
    if (!assertEditable()) return;
    setError(null);
    const result = await removeSessionCohost(sessionId, cohostId, challenge.id);
    if (result?.error) { setError(result.error); return; }
    refreshAfterAction();
  }

  async function handleAddSession() {
    if (!assertEditable()) return;
    if (!sessTitle.trim() || !sessDate) return;
    if (isSessionDateOutOfRange(sessDate)) {
      setError(`Session must fall within the program window (${sessionRangeLabel ?? ""}).`);
      return;
    }
    setAddingSession(true);
    setError(null);
    const result = await createChallengeSession(
      challenge.id, sessTitle.trim(), sessDate, parseInt(sessDuration), sessImageUrl,
      sessDescription.trim() || null,
    );
    if (result?.error) { setError(result.error); setAddingSession(false); return; }

    const newSessionId = (result as { sessionId?: string }).sessionId;
    if (newSessionId && sessCohostIds.length > 0) {
      for (const cohostId of sessCohostIds) {
        const r = await addSessionCohost(newSessionId, cohostId, null, challenge.id);
        if (r?.error) {
          setError(`Session created, but couldn't add cohost: ${r.error}`);
        }
      }
    }

    setSessTitle("");
    setSessDate("");
    setSessImageUrl(null);
    setSessDescription("");
    setSessCohostIds([]);
    setShowAddSession(false);
    setAddingSession(false);
    refreshAfterAction();
  }

  // Pre-fill the add-session form to a date inside a specific week,
  // then open the modal. Called by ProgramRhythmSection's "+ Add
  // session in Week N" button. Polish v12: form opens as a centered
  // Dialog instead of expanding inline beneath the rhythm card, so no
  // scroll-into-view step is needed.
  function handleAddSessionForWeek(_weekNum: number, suggestedDate: Date) {
    // Default time = 19:00 local on the suggested date
    const dt = new Date(suggestedDate);
    dt.setHours(19, 0, 0, 0);
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localISO = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
    setSessDate(localISO);
    setShowAddSession(true);
  }

  function closeAddSession() {
    setShowAddSession(false);
    setSessTitle("");
    setSessDate("");
    setSessImageUrl(null);
    setSessDescription("");
    setSessCohostIds([]);
  }

  // ── Contract flow (unchanged) ──

  async function handleLockTerms() {
    setLocking(true); setError(null);
    const result = await lockTerms(challenge.id);
    if (result.error) { setError(result.error); setLocking(false); return; }
    setLocking(false);
    refreshAfterAction();
  }

  async function handleConfirm() {
    if (!contract) return;
    setConfirming(true); setError(null);
    const result = await confirmTerms(contract.id);
    if (result.error) { setError(result.error); setConfirming(false); return; }
    setAcceptModalOpen(false);
    setConfirming(false);
    refreshAfterAction();
  }

  async function handleRequestChanges() {
    if (!contract) return;
    const comment = prompt("What changes would you like? (optional)");
    setConfirming(true); setError(null);
    const result = await requestChanges(contract.id, comment ?? undefined);
    if (result.error) { setError(result.error); setConfirming(false); return; }
    setConfirming(false);
    refreshAfterAction();
  }

  async function handleReactivate() {
    if (!contract) return;
    setLocking(true); setError(null);
    const result = await reactivateDrafting(challenge.id, contract.id);
    if (result.error) { setError(result.error); setLocking(false); return; }
    setLocking(false);
    refreshAfterAction();
  }

  async function handlePublish() {
    setPublishing(true); setError(null);
    const result = await publishChallenge(challenge.id);
    if (result?.error) { setError(result.error); setPublishing(false); return; }
  }

  // ── Banner data ──
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

  // ── Build TeamSection inputs ──
  const teamCreators: CreatorRow[] = [
    {
      id: ownerProfile.id,
      name: ownerProfile.name,
      avatar: ownerProfile.avatar,
      tagline: ownerProfile.tagline ?? null,
      bio: ownerProfile.bio ?? null,
      username: ownerProfile.username ?? null,
      role: "owner",
      sessionCount: sessionCountByCreator[ownerProfile.id] ?? 0,
      splitPercent: ownerSplit,
    },
    ...cohosts.map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      tagline: c.tagline ?? null,
      bio: c.bio ?? null,
      username: c.username ?? null,
      role: "cohost" as const,
      sessionCount: sessionCountByCreator[c.id] ?? 0,
      splitPercent: c.splitPercent,
    })),
  ];

  const teamPendingInvites: PendingInviteRow[] = (pendingInvites ?? []).map((i) => ({
    id: i.id,
    toId: i.toId,
    toName: i.toName,
    toAvatar: i.toAvatar,
    toTagline: i.toTagline ?? null,
    toUsername: i.toUsername ?? null,
    splitPercent: i.splitPercent,
    message: i.message,
  }));

  return (
    <div className="space-y-6">
      {/* Status pill — replaces per-section Save buttons */}
      {(saveStatus.kind !== "idle" || error) && (
        <div className="flex justify-end">
          {error && saveStatus.kind === "idle" && (
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold font-headline"
              style={{
                backgroundColor: "rgba(220,38,38,0.08)",
                color: "#dc2626",
                border: "1px solid rgba(220,38,38,0.25)",
              }}
            >
              {error}
            </span>
          )}
          {saveStatus.kind !== "idle" && <SaveStatusPill status={saveStatus} />}
        </div>
      )}

      {/* ── SIGNED CONTRACT LINK ───────────────────── */}
      {hasContractDoc && (
        <a
          href={`/dashboard/collaborate/${challenge.id}/contract`}
          className="flex items-center gap-3 px-5 py-4 rounded-2xl group transition-colors"
          style={
            isPublished
              ? { backgroundColor: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.25)" }
              : { backgroundColor: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.18)" }
          }
        >
          <span
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={
              isPublished
                ? { backgroundColor: "rgba(21,128,61,0.12)", color: "#15803d" }
                : { backgroundColor: "rgba(8,145,178,0.12)", color: "#0891b2" }
            }
          >
            📜
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black font-headline truncate" style={{ color: "#0F2229" }}>
              {isPublished ? "Signed & published — view contract" : "View locked contract"}
            </p>
            <p className="text-[11px] text-[#94a3b8] truncate">
              The frozen agreement everyone signed. Read-only document.
            </p>
          </div>
          <span className="shrink-0 text-xs font-black font-headline" style={{ color: isPublished ? "#15803d" : "#0891b2" }}>
            Open →
          </span>
        </a>
      )}

      {/* ── CONTRACT STATUS BANNER (locked only) ─── */}
      {isLocked && contract && (
        <ContractStatusBanner
          ownerName={ownerProfile.name}
          lockedAt={contract.lockedAt}
          parties={contractParties}
          hasDeclines={hasDeclines}
        />
      )}

      {/* Contract envelope (locked only) — same tinted tray as before. */}
      <div
        className={`space-y-6 transition-colors duration-300 ${isLocked ? "rounded-3xl p-5 sm:p-6" : ""}`}
        style={
          isLocked
            ? allAccepted && !hasDeclines
              ? { backgroundColor: "#A8D5DC", border: "1px solid rgba(8,145,178,0.35)" }
              : { backgroundColor: "#D8DEE2", border: "1px solid rgba(15,34,41,0.1)" }
            : undefined
        }
      >
        {/* ── 1. COVER IMAGE ─────────────────────────── */}
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-full aspect-[3/2] rounded-xl object-cover" />
            ) : (
              <div className="w-full aspect-[3/2] rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.png" alt="" width={48} height={48} style={{ opacity: 0.15 }} />
              </div>
            )}
          </div>
        </div>

        {/* ── 2. CHALLENGE DETAILS (auto-save on blur) ─── */}
        <div className="rounded-2xl infitra-card p-6">
          <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider mb-5">
            Challenge Details
          </h3>

          {canEdit ? (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={commitTitle}
                  className="w-full rounded-xl p-3 text-base font-bold font-headline focus:outline-none"
                  style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
                />
              </div>
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={commitDescription}
                  rows={3}
                  placeholder="What will participants experience?"
                  className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none"
                  style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onBlur={commitStartDate}
                    className="w-full rounded-xl p-2.5 text-sm font-bold font-headline focus:outline-none"
                    style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Duration (weeks)</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={durationWeeks}
                    // Select-all on focus so typing replaces the value
                    // instead of appending (the "1→14→52" bug from
                    // polish v3 — without this, the cursor sat after
                    // the current digit and the user could only add).
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        // Allow temporarily-empty while user is mid-edit.
                        // Final clamp happens on blur via commitDurationWeeks.
                        setDurationWeeks(1);
                        return;
                      }
                      const n = parseInt(raw, 10);
                      if (!Number.isFinite(n)) return;
                      setDurationWeeks(Math.max(1, Math.min(52, n)));
                    }}
                    onBlur={commitDurationWeeks}
                    className="w-full rounded-xl p-2.5 text-sm font-bold font-headline focus:outline-none"
                    style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
                  />
                  {/* Derived end-date display — programs are always whole
                      weeks; this ends-on text shows what that resolves to. */}
                  <p className="text-[10px] mt-1.5" style={{ color: "#94a3b8" }}>
                    Ends on{" "}
                    <span className="font-bold" style={{ color: "#475569" }}>
                      {derivedEndDate
                        ? new Date(derivedEndDate).toLocaleDateString("en-GB", {
                            weekday: "short", day: "numeric", month: "short",
                          })
                        : "—"}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Price (CHF)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onBlur={commitPrice}
                    placeholder="0"
                    className="w-full rounded-xl p-2.5 text-sm font-bold font-headline focus:outline-none"
                    style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
                  />
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

          <SectionAttribution
            fields={DETAILS_ATTRIBUTION_FIELDS}
            activity={activity}
            profiles={profileMap}
          />
        </div>

        {/* ── 3. THE PROMISE ───────────────────────────── */}
        <PromiseEditor
          value={promiseText}
          onChange={setPromiseText}
          onCommit={commitPromise}
          canEdit={canEdit}
          activity={activity}
          profileMap={profileMap}
        />

        {/* ── 4. THE TEAM ──────────────────────────────── */}
        <TeamSection
          challengeId={challenge.id}
          creators={teamCreators}
          pendingInvites={teamPendingInvites}
          topicsByCreator={topicsByCreator}
          ownerSplit={ownerSplit}
          canEdit={canEdit}
          canManageCollaboration={canManageCollaboration}
          onTopicsCommit={commitTopics}
          onCohostSplitCommit={commitCohostSplit}
          onCohostRemove={commitCohostRemove}
          activity={activity}
          profileMap={profileMap}
        />

        {/* ── 5. PROGRAM RHYTHM ────────────────────────── */}
        <ProgramRhythmSection
          startDate={startDate}
          endDate={derivedEndDate}
          weeklyFocus={weeklyArc}
          sessions={sessions.map((s) => ({ id: s.id, startTime: s.startTime }))}
          canEdit={canAddSession}
          onFocusCommit={commitWeeklyFocus}
          renderSessionCard={(sessionId) => renderSessionCard(sessionId)}
          onAddSessionForWeek={handleAddSessionForWeek}
          addingSessionDisabled={addingSession}
          activity={activity}
          profileMap={profileMap}
        />

        {/* Add-session form — centered Dialog (polish v12). Triggered
            by the "+ Add session in Week N" buttons on the rhythm card.
            The form lives in a modal portal so it doesn't push the
            workspace around or get cut off by surrounding cards. */}
        <Dialog
          open={showAddSession && canAddSession}
          onClose={closeAddSession}
          maxWidthClass="max-w-2xl"
          closeOnBackdrop={!sessTitle.trim() && !sessDescription.trim()}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black font-headline text-[#0F2229]">
                New Session
              </h3>
              <button
                type="button"
                onClick={closeAddSession}
                className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]"
              >
                Cancel
              </button>
            </div>
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Session Title</label>
              <input
                value={sessTitle}
                onChange={(e) => setSessTitle(e.target.value)}
                placeholder="e.g. Foundations 1"
                className="w-full rounded-xl p-3 text-base font-bold focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
            {/* Polish v12.L.2: Date, Start time, Duration split into
                three real inputs so users actually see they can pick
                the time, not just the date. The validator + save still
                read from `sessDate` (the combined ISO string). */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Date</label>
                <input
                  type="date"
                  value={splitIso(sessDate).date}
                  onChange={(e) => setDatePart(setSessDate, sessDate, e.target.value)}
                  min={startDate || undefined}
                  max={derivedEndDate || undefined}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none"
                  style={{
                    border: `1px solid ${isSessionDateOutOfRange(sessDate) ? "rgba(220,38,38,0.40)" : "rgba(15,34,41,0.10)"}`,
                    color: "#0F2229",
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Start time</label>
                <input
                  type="time"
                  value={splitIso(sessDate).time}
                  onChange={(e) => setTimePart(setSessDate, sessDate, e.target.value)}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none"
                  style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
                />
              </div>
              <div>
                <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Duration (min)</label>
                <input
                  type="number"
                  value={sessDuration}
                  onChange={(e) => setSessDuration(e.target.value)}
                  min="5" max="480"
                  className="w-full rounded-xl p-3 text-sm focus:outline-none"
                  style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
                />
              </div>
            </div>
            {isSessionDateOutOfRange(sessDate) ? (
              <p className="text-[11px] font-bold" style={{ color: "#dc2626" }}>
                Outside the program window ({sessionRangeLabel}).
              </p>
            ) : sessionRangeLabel ? (
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                Program runs {sessionRangeLabel}.
              </p>
            ) : null}
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Description (optional)</label>
              <textarea
                value={sessDescription}
                onChange={(e) => setSessDescription(e.target.value)}
                placeholder="What participants will do, what to expect, what to bring…"
                rows={3}
                className="w-full rounded-xl p-3 text-sm focus:outline-none resize-y"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Cover Image (optional)</label>
              <ImageSelector currentUrl={sessImageUrl} title={sessTitle} onSelect={setSessImageUrl} size="sm" />
            </div>

            {/* Cohost selector */}
            {(() => {
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
                            // eslint-disable-next-line @next/next/no-img-element
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
              disabled={addingSession || !sessTitle.trim() || !sessDate || isSessionDateOutOfRange(sessDate)}
              className="px-5 py-2.5 rounded-full text-sm font-black font-headline text-white disabled:opacity-40"
              style={{ backgroundColor: "#0891b2" }}
            >
              {addingSession ? "Adding..." : "Add Session"}
            </button>
          </div>
        </Dialog>

        {/* ── 6. INTRO PROMPT ──────────────────────────── */}
        <IntroPromptEditor
          value={introPrompt}
          onChange={setIntroPrompt}
          onCommit={commitIntro}
          canEdit={canEdit}
          activity={activity}
          profileMap={profileMap}
        />

        {/* ── 7. SIGNING / ACTION PANEL ───────────────── */}
        <div className="rounded-2xl infitra-card p-6">
          {error && saveStatus.kind === "idle" && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {!isLocked && isDraft && isOwner && (
            <div>
              <p className="text-base text-[#64748b] mb-4">
                When you&apos;re happy with everything, lock the terms for your collaborator to review.
              </p>
              <button
                onClick={handleLockTerms}
                disabled={locking || cohosts.length === 0 || saveStatus.kind === "saving"}
                className="px-6 py-3 rounded-full text-white text-base font-black font-headline disabled:opacity-40 w-full"
                style={{ backgroundColor: "#0891b2" }}
              >
                {locking ? "Locking..." : "Lock Terms for Review"}
              </button>
              {saveStatus.kind === "saving" && (
                <p className="text-xs font-bold text-[#FF6130] text-center mt-3">
                  Wait a moment — saves are landing.
                </p>
              )}
              {cohosts.length === 0 && (
                <p className="text-xs font-bold text-[#94a3b8] text-center mt-3">
                  Invite at least one collaborator before locking.
                </p>
              )}
            </div>
          )}

          {!isLocked && isDraft && !isOwner && (
            <p className="text-sm text-[#94a3b8] text-center">
              Waiting for {ownerProfile.name} to finalize and lock terms.
            </p>
          )}

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

          {isLocked && !hasDeclines && !isOwner && contract?.acceptances.includes(currentUserId) && !allAccepted && (
            <p className="text-sm text-[#94a3b8] text-center">
              You&apos;ve accepted. Waiting on the remaining collaborators.
            </p>
          )}

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

          {isLocked && hasDeclines && !isOwner && (
            <p className="text-sm text-[#94a3b8] text-center">
              Waiting for {ownerProfile.name} to reopen the draft.
            </p>
          )}

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

          {isLocked && allAccepted && !isOwner && (
            <p className="text-sm text-[#94a3b8] text-center">
              All signatures in. Waiting for {ownerProfile.name} to publish.
            </p>
          )}

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

      {/* Polish v12: session edit lives in its own Dialog now (no
          longer inline inside the rhythm card row). Triggered by the
          pencil button on each session card OR the Edit button in
          SessionDetailModal. Shares state with the add-session form
          via `editFields` / `editingSessionId`. */}
      <Dialog
        open={editingSessionId !== null}
        onClose={() => setEditingSessionId(null)}
        maxWidthClass="max-w-2xl"
        closeOnBackdrop={false}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black font-headline text-[#0F2229]">
              Edit Session
            </h3>
            <button
              type="button"
              onClick={() => setEditingSessionId(null)}
              className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]"
            >
              Cancel
            </button>
          </div>
          <div>
            <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Title</label>
            <input
              value={editFields.title}
              onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
              className="w-full rounded-xl p-3 text-base font-bold focus:outline-none"
              style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
            />
          </div>
          {/* Polish v12.L.2: split into Date / Start time / Duration. */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Date</label>
              <input
                type="date"
                value={splitIso(editFields.startTime).date}
                onChange={(e) => setDatePart(
                  (next) => setEditFields({ ...editFields, startTime: next }),
                  editFields.startTime,
                  e.target.value,
                )}
                min={startDate || undefined}
                max={derivedEndDate || undefined}
                className="w-full rounded-xl p-3 text-sm focus:outline-none"
                style={{
                  border: `1px solid ${isSessionDateOutOfRange(editFields.startTime) ? "rgba(220,38,38,0.40)" : "rgba(15,34,41,0.10)"}`,
                  color: "#0F2229",
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Start time</label>
              <input
                type="time"
                value={splitIso(editFields.startTime).time}
                onChange={(e) => setTimePart(
                  (next) => setEditFields({ ...editFields, startTime: next }),
                  editFields.startTime,
                  e.target.value,
                )}
                className="w-full rounded-xl p-3 text-sm focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Duration (min)</label>
              <input
                type="number" min={5} max={480}
                value={editFields.duration}
                onChange={(e) => setEditFields({ ...editFields, duration: e.target.value })}
                className="w-full rounded-xl p-3 text-sm focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
          </div>
          {isSessionDateOutOfRange(editFields.startTime) ? (
            <p className="text-[11px] font-bold" style={{ color: "#dc2626" }}>
              Outside the program window ({sessionRangeLabel}).
            </p>
          ) : sessionRangeLabel ? (
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              Program runs {sessionRangeLabel}.
            </p>
          ) : null}
          <div>
            <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Description (optional)</label>
            <textarea
              value={editFields.description}
              onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
              placeholder="What participants will do, what to expect, what to bring…"
              rows={3}
              className="w-full rounded-xl p-3 text-sm focus:outline-none resize-y"
              style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
            />
          </div>
          <div>
            <label className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-2">Cover Image (optional)</label>
            <ImageSelector currentUrl={editFields.imageUrl} title={editFields.title} onSelect={(url) => setEditFields({ ...editFields, imageUrl: url })} size="sm" />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => editingSessionId && handleSaveSession(editingSessionId)}
              disabled={savingSession || !editFields.title.trim() || !editFields.startTime || isSessionDateOutOfRange(editFields.startTime)}
              className="px-5 py-2.5 rounded-full text-sm font-black font-headline text-white disabled:opacity-40"
              style={{ backgroundColor: "#FF6130" }}
            >
              {savingSession ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Session detail popup. Edit + Delete only show when the viewer
          is the host (RPC-enforced) — the modal calls back to the same
          edit / delete flow as the workspace card affordances. */}
      <SessionDetailModal
        open={!!detailSession}
        session={detailSession}
        onClose={() => setDetailSession(null)}
        onEdit={
          detailSession && canEditSession(detailSession.hostId)
            ? () => startEditSession(detailSession)
            : undefined
        }
        onDelete={
          detailSession && (canEditSession(detailSession.hostId) || canManageCollaboration)
            ? () => handleDeleteSession(detailSession.id)
            : undefined
        }
      />

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

      {/* Owner publish — signature moment #2. */}
      <ContractCommitmentModal
        open={publishModalOpen}
        title="Publish the collaboration?"
        introLine="By publishing, you commit to the following:"
        bullets={[
          "You agree to fulfill your contributions as stated.",
          "You are publishing the collaboration with the accepted terms.",
          "Once published, the terms are binding for everyone.",
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

  // ─────────────────────────────────────────────────────────────────
  // renderSessionCard — passed as a render-prop into ProgramRhythmSection
  // so each week's sessions appear inline. Preserves the existing
  // display + inline-edit + cohost-picker UI without duplication.
  // Closures over all the relevant local state.
  // ─────────────────────────────────────────────────────────────────
  function renderSessionCard(sessionId: string) {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return null;

    const existingIds = new Set([s.hostId, ...s.cohosts.map((c) => c.id)]);
    const candidateList: { id: string; name: string; avatar: string | null }[] = [];
    if (!existingIds.has(ownerProfile.id)) {
      candidateList.push({ id: ownerProfile.id, name: ownerProfile.name, avatar: ownerProfile.avatar });
    }
    cohosts.forEach((cc) => {
      if (!existingIds.has(cc.id)) candidateList.push({ id: cc.id, name: cc.name, avatar: cc.avatar });
    });

    return (
      <div
        className="p-3 rounded-xl cursor-pointer hover:bg-white/80 transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(15,34,41,0.06)" }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button")) return;
          setDetailSession(s);
        }}
      >
        {/* Polish v12: edit form lives in a top-level Dialog (rendered
            below at the end of the editor). The session card always
            renders display mode; the pencil button opens the modal. */}
        {/* DISPLAY MODE — polish v12 (revised): host/cohost names row
            is now INSIDE the right-side text column instead of a
            separate indented row below. This means the card height
            hugs the 96px hero image instead of extending below it,
            and `items-center` vertically centers the text column
            against the image — equal breathing room above and below. */}
        <div className="flex items-center gap-4">
          {s.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.imageUrl} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="" width={28} height={28} style={{ opacity: 0.18 }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-black font-headline text-[#0F2229] truncate leading-tight">{s.title}</p>
            <p className="text-xs font-bold mt-1" style={{ color: "#64748b" }} suppressHydrationWarning>
              {new Date(s.startTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {" · "}{s.durationMinutes} min
            </p>
            {s.description && s.description.trim() && (
              <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "#475569" }}>
                {s.description}
              </p>
            )}
            {/* Host / cohost names row — moved into the text column so
                the card stays visually contained within the image's
                vertical band. */}
            <div className="mt-2 flex items-center flex-wrap gap-x-2 gap-y-1">
              <span className="text-[11px] text-[#94a3b8]">
                <span className="font-bold text-[#FF6130]">{s.hostName}</span>
                <span className="text-[9px] uppercase tracking-wider ml-1">Host</span>
              </span>
              {s.cohosts.map((c) => (
                <span key={c.id} className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                  · <span className="font-bold text-[#0891b2]">{c.name}</span>
                  <span className="text-[9px] uppercase tracking-wider">Cohost</span>
                  {canEditSession(s.hostId) && (
                    <button
                      onClick={() => handleRemoveSessionCohost(s.id, c.id)}
                      className="text-[#94a3b8] hover:text-red-500 ml-0.5"
                      title="Remove cohost"
                    >
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
                    className="text-[11px] font-bold font-headline text-[#FF6130] cursor-pointer"
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
                            // eslint-disable-next-line @next/next/no-img-element
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
          </div>
          {/* Host + cohort avatars (small stack on the right) */}
          <div className="flex -space-x-2 shrink-0">
            {s.hostAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.hostAvatar} alt={s.hostName} title={`${s.hostName} (Host)`} className="w-7 h-7 rounded-full object-cover" style={{ border: "2px solid white", zIndex: 10 }} />
            ) : (
              <div title={`${s.hostName} (Host)`} className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center" style={{ border: "2px solid white", zIndex: 10 }}>
                <span className="text-[10px] font-black text-orange-700">{s.hostName[0]}</span>
              </div>
            )}
            {s.cohosts.map((c, idx) => (
              c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={c.id} src={c.avatar} alt={c.name} title={c.name} className="w-7 h-7 rounded-full object-cover" style={{ border: "2px solid white", zIndex: 9 - idx }} />
              ) : (
                <div key={c.id} title={c.name} className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center" style={{ border: "2px solid white", zIndex: 9 - idx }}>
                  <span className="text-[10px] font-black text-cyan-700">{c.name[0]}</span>
                </div>
              )
            ))}
          </div>
          {canEditSession(s.hostId) && (
            <button
              onClick={() => startEditSession(s)}
              className="text-[#94a3b8] hover:text-[#FF6130] shrink-0"
              title="Edit session"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {(canEditSession(s.hostId) || canManageCollaboration) && (
            <button
              onClick={() => handleDeleteSession(s.id)}
              className="text-[#94a3b8] hover:text-red-500 shrink-0"
              title="Delete session"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
}

// Programs are sold by the WEEK, not by arbitrary date range. The UI
// asks for a duration in weeks; we derive end_date from start + weeks
// so the database column stays accurate to what was advertised.
//
// computeWeeksBetween: load existing programs (with potentially fractional
// week durations) and round to nearest whole week. New programs always
// start on an exact week count via the duration input.
//
// computeEndDate: given a start_date and a number of weeks, return the
// last day of the program (start + weeks*7 - 1 days, formatted YYYY-MM-DD).
function computeWeeksBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 4;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 4;
  const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.round(days / 7));
}

function computeEndDate(startDate: string, weeks: number): string {
  if (!startDate || !weeks) return startDate;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return startDate;
  const end = new Date(start.getTime() + (weeks * 7 - 1) * 86400000);
  return end.toISOString().split("T")[0];
}
