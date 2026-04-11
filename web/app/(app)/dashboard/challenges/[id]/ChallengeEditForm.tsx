"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateChallenge,
  deleteChallenge,
  createChallengeSession,
  updateChallengeSession,
  removeChallengeSession,
} from "@/app/actions/challenge";
import { ImageSelector } from "@/app/components/ImageSelector";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl focus:outline-none transition-colors text-sm";

const INPUT_SM_CLASS =
  "w-full px-3 py-2 rounded-lg focus:outline-none transition-colors text-sm";

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.78)",
  border: "1px solid rgba(15, 34, 41, 0.15)",
  color: "#0F2229",
};

const LABEL =
  "block text-xs font-bold uppercase tracking-wider mb-2 font-headline";

const LABEL_STYLE: React.CSSProperties = {
  color: "rgba(15, 34, 41, 0.55)",
};

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  capacity: number | null;
  price_cents: number;
}

interface SessionSummary {
  id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
}

export function ChallengeEditForm({
  challenge,
  linkedSessions: initialLinked,
}: {
  challenge: Challenge;
  linkedSessions: SessionSummary[];
}) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(challenge.image_url);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sessionPending, startSessionTransition] = useTransition();

  const [linked, setLinked] = useState<SessionSummary[]>(initialLinked);

  // Add session form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");
  const [newDuration, setNewDuration] = useState("60");
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);

  // Edit session form state
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("");

  const [state, action, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      const result = await updateChallenge(prev, fd);
      if (result?.success) {
        router.push(`/dashboard/challenges/${challenge.id}/preview`);
      }
      return result;
    },
    null
  );

  const priceCHF = challenge.price_cents / 100;

  async function handleDelete() {
    if (
      !confirm("Delete this draft and all its sessions? This cannot be undone.")
    )
      return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteChallenge(challenge.id);
    if (result?.error) {
      setDeleteError(result.error);
      setDeleting(false);
    }
  }

  function handleAddSession() {
    setSessionError(null);
    if (!newTitle.trim() || newTitle.trim().length < 3) {
      setSessionError("Session title must be at least 3 characters.");
      return;
    }
    if (!newDate || !newTime) {
      setSessionError("Session date and time are required.");
      return;
    }
    const dur = parseInt(newDuration);
    if (!dur || dur < 5 || dur > 480) {
      setSessionError("Duration must be between 5 and 480 minutes.");
      return;
    }

    const startTime = new Date(`${newDate}T${newTime}`).toISOString();

    startSessionTransition(async () => {
      const result = await createChallengeSession(
        challenge.id,
        newTitle.trim(),
        startTime,
        dur,
        newImageUrl,
        newDescription.trim() || null
      );
      if (result?.error) {
        setSessionError(result.error);
      } else if (result?.sessionId) {
        setLinked((prev) => [
          ...prev,
          {
            id: result.sessionId,
            title: newTitle.trim(),
            start_time: startTime,
            duration_minutes: dur,
          },
        ]);
        setNewTitle("");
        setNewDescription("");
        setNewDate("");
        setNewTime("10:00");
        setNewDuration("60");
        setNewImageUrl(null);
        setShowAddForm(false);
      }
    });
  }

  function startEditing(sess: SessionSummary) {
    setEditingId(sess.id);
    setEditTitle(sess.title);
    const d = new Date(sess.start_time);
    setEditDate(d.toISOString().split("T")[0]);
    setEditTime(d.toTimeString().slice(0, 5));
    setEditDuration(String(sess.duration_minutes));
  }

  function handleSaveEdit(sessionId: string) {
    setSessionError(null);
    const dur = parseInt(editDuration);
    const startTime = new Date(`${editDate}T${editTime}`).toISOString();

    startSessionTransition(async () => {
      const result = await updateChallengeSession(
        sessionId,
        editTitle.trim(),
        startTime,
        dur
      );
      if (result?.error) {
        setSessionError(result.error);
      } else {
        setLinked((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  title: editTitle.trim(),
                  start_time: startTime,
                  duration_minutes: dur,
                }
              : s
          )
        );
        setEditingId(null);
      }
    });
  }

  function handleRemoveSession(session: SessionSummary) {
    setSessionError(null);
    setLinked((prev) => prev.filter((s) => s.id !== session.id));

    startSessionTransition(async () => {
      const result = await removeChallengeSession(challenge.id, session.id);
      if (result?.error) {
        setSessionError(result.error);
        setLinked((prev) => [...prev, session]);
      }
    });
  }

  function formatSessionDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function formatSessionTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-8">
      {/* ── Challenge Details Form ─────────────────────────────── */}
      <form action={action} className="space-y-6" data-challenge-form>
        <input type="hidden" name="challenge_id" value={challenge.id} />
        <input type="hidden" name="image_url" value={imageUrl ?? ""} />

        {/* Cover Image */}
        <div>
          <label className={LABEL} style={LABEL_STYLE}>
            Cover Image
            <span className="font-normal normal-case tracking-normal ml-2" style={{ color: "#94a3b8" }}>recommended</span>
          </label>
          <ImageSelector currentUrl={imageUrl} title={challenge.title || "Challenge"} onSelect={setImageUrl} size="md" />
        </div>

        {(state?.error || deleteError) && (
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: "rgba(255, 97, 48, 0.10)",
              border: "1px solid rgba(255, 97, 48, 0.30)",
            }}
          >
            <p className="text-sm" style={{ color: "#FF6130" }}>
              {state?.error || deleteError}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="title" className={LABEL} style={LABEL_STYLE}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={120}
            defaultValue={
              challenge.title === "Untitled Challenge" ? "" : challenge.title
            }
            placeholder="e.g. 30-Day HIIT Challenge"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div>
          <label htmlFor="description" className={LABEL} style={LABEL_STYLE}>
            Description
            <span
              className="font-normal normal-case tracking-normal ml-2"
              style={{ color: "#94a3b8" }}
            >
              optional
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={challenge.description ?? ""}
            placeholder="What will participants achieve by the end?"
            className={`${INPUT_CLASS} resize-none`}
            style={INPUT_STYLE}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className={LABEL} style={LABEL_STYLE}>
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              defaultValue={challenge.start_date}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label htmlFor="end_date" className={LABEL} style={LABEL_STYLE}>
              End Date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              defaultValue={challenge.end_date}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className={LABEL} style={LABEL_STYLE}>
              Price (CHF)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              required
              min={0}
              step={0.5}
              defaultValue={priceCHF}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
            <p className="text-[10px] mt-1.5" style={{ color: "#94a3b8" }}>
              Must be &gt; 0 to publish.
            </p>
          </div>
          <div>
            <label htmlFor="capacity" className={LABEL} style={LABEL_STYLE}>
              Capacity
              <span
                className="font-normal normal-case tracking-normal ml-2"
                style={{ color: "#94a3b8" }}
              >
                optional
              </span>
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={10000}
              defaultValue={challenge.capacity ?? ""}
              placeholder="Unlimited"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
        </div>
      </form>

      {/* ── Sessions ───────────────────────────────────────────── */}
      <div
        className="pt-6 border-t"
        style={{ borderColor: "rgba(15, 34, 41, 0.10)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className={LABEL} style={LABEL_STYLE}>
              Sessions
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full font-headline"
              style={{
                color: "rgba(15, 34, 41, 0.55)",
                backgroundColor: "rgba(15, 34, 41, 0.06)",
              }}
            >
              {linked.length}
            </span>
          </div>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              disabled={sessionPending}
              className="text-xs font-bold transition-colors font-headline disabled:opacity-50 hover:opacity-80"
              style={{ color: "#FF6130" }}
            >
              + Add Session
            </button>
          )}
        </div>

        {sessionError && (
          <div
            className="p-3 rounded-xl mb-3"
            style={{
              backgroundColor: "rgba(255, 97, 48, 0.10)",
              border: "1px solid rgba(255, 97, 48, 0.30)",
            }}
          >
            <p className="text-sm" style={{ color: "#FF6130" }}>
              {sessionError}
            </p>
          </div>
        )}

        <p className="text-[10px] mb-4" style={{ color: "#94a3b8" }}>
          Minimum 3 sessions required to publish. Sessions are published
          together with the challenge.
        </p>

        {/* Add session inline form */}
        {showAddForm && (
          <div
            className="mb-4 p-4 rounded-xl space-y-3"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.55)",
              border: "1px solid rgba(15, 34, 41, 0.10)",
            }}
          >
            <p
              className="text-xs font-bold font-headline"
              style={{ color: "rgba(15, 34, 41, 0.55)" }}
            >
              New Session
            </p>
            {/* Session cover image */}
            <ImageSelector currentUrl={newImageUrl} title={newTitle || "Session"} onSelect={setNewImageUrl} size="sm" />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Session title"
              minLength={3}
              maxLength={120}
              className={INPUT_SM_CLASS}
              style={INPUT_STYLE}
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What happens in this session? (optional)"
              maxLength={1000}
              rows={2}
              className={`${INPUT_SM_CLASS} resize-none`}
              style={INPUT_STYLE}
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={INPUT_SM_CLASS}
                style={INPUT_STYLE}
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className={INPUT_SM_CLASS}
                style={INPUT_STYLE}
              />
              <div className="relative">
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  min={5}
                  max={480}
                  placeholder="60"
                  className={INPUT_SM_CLASS}
                  style={INPUT_STYLE}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                  style={{ color: "#94a3b8" }}
                >
                  min
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddSession}
                disabled={sessionPending}
                className="px-4 py-2 rounded-lg text-white text-xs font-bold font-headline hover:scale-[1.02] transition-transform disabled:opacity-50"
                style={{
                  backgroundColor: "#FF6130",
                  boxShadow: "0 4px 14px rgba(255,97,48,0.30)",
                }}
              >
                {sessionPending ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSessionError(null);
                }}
                className="px-4 py-2 text-xs font-headline transition-colors hover:opacity-80"
                style={{ color: "#64748b" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Session list */}
        {linked.length > 0 ? (
          <div className="space-y-2">
            {linked
              .sort(
                (a, b) =>
                  new Date(a.start_time).getTime() -
                  new Date(b.start_time).getTime()
              )
              .map((sess) =>
                editingId === sess.id ? (
                  /* Editing mode */
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl space-y-3"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.55)",
                      border: "1px solid rgba(8, 145, 178, 0.30)",
                    }}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={INPUT_SM_CLASS}
                      style={INPUT_STYLE}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className={INPUT_SM_CLASS}
                        style={INPUT_STYLE}
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className={INPUT_SM_CLASS}
                        style={INPUT_STYLE}
                      />
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        min={5}
                        max={480}
                        className={INPUT_SM_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(sess.id)}
                        disabled={sessionPending}
                        className="px-3 py-1.5 rounded-lg text-white text-xs font-bold font-headline disabled:opacity-50"
                        style={{
                          backgroundColor: "#FF6130",
                          boxShadow: "0 4px 14px rgba(255,97,48,0.30)",
                        }}
                      >
                        {sessionPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs font-headline transition-colors hover:opacity-80"
                        style={{ color: "#64748b" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3 rounded-xl infitra-glass group/item"
                  >
                    <button
                      type="button"
                      onClick={() => startEditing(sess)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p
                        className="text-sm font-bold font-headline truncate transition-colors"
                        style={{ color: "#0F2229" }}
                      >
                        {sess.title}
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: "#64748b" }}
                      >
                        {formatSessionDate(sess.start_time)} at{" "}
                        {formatSessionTime(sess.start_time)} &middot;{" "}
                        {sess.duration_minutes} min
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(sess)}
                      disabled={sessionPending}
                      className="ml-3 p-1.5 rounded-lg transition-all disabled:opacity-50 opacity-0 group-hover/item:opacity-100 hover:bg-rose-100/60"
                      style={{ color: "#94a3b8" }}
                      title="Remove session"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )
              )}
          </div>
        ) : (
          <div
            className="text-center py-8 rounded-xl border border-dashed"
            style={{ borderColor: "rgba(15, 34, 41, 0.15)" }}
          >
            <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>
              No sessions yet.
            </p>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="text-xs font-bold font-headline"
                style={{ color: "#FF6130" }}
              >
                + Add your first session
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Actions (at the very bottom) ─────────────────────── */}
      <div className="flex items-center gap-3 pt-8">
        <button
          type="button"
          onClick={() => {
            // Programmatically submit the form
            const form = document.querySelector(
              "form[data-challenge-form]"
            ) as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          disabled={pending}
          className="flex-1 py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
          style={{
            backgroundColor: "#FF6130",
            boxShadow:
              "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
          }}
        >
          {pending ? "Saving..." : "Save & Preview"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-5 py-3.5 rounded-full text-sm font-bold transition-all font-headline disabled:opacity-50 hover:opacity-80"
          style={{
            color: "#be123c",
            border: "1px solid rgba(190, 18, 60, 0.25)",
          }}
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
