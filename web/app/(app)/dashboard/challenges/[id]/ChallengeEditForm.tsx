"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateChallenge,
  deleteChallenge,
  addSessionToChallenge,
  removeSessionFromChallenge,
} from "@/app/actions/challenge";

const INPUT =
  "w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm";

const LABEL =
  "block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
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
  availableSessions: initialAvailable,
}: {
  challenge: Challenge;
  linkedSessions: SessionSummary[];
  availableSessions: SessionSummary[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [linkPending, startLinkTransition] = useTransition();

  // Optimistic session lists
  const [linked, setLinked] = useState<SessionSummary[]>(initialLinked);
  const [available, setAvailable] =
    useState<SessionSummary[]>(initialAvailable);

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
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteChallenge(challenge.id);
    if (result?.error) {
      setDeleteError(result.error);
      setDeleting(false);
    }
  }

  function handleLinkSession(session: SessionSummary) {
    setSessionError(null);
    // Optimistic update
    setLinked((prev) => [...prev, session]);
    setAvailable((prev) => prev.filter((s) => s.id !== session.id));
    setShowPicker(false);

    startLinkTransition(async () => {
      const result = await addSessionToChallenge(challenge.id, session.id);
      if (result?.error) {
        setSessionError(result.error);
        // Revert
        setLinked((prev) => prev.filter((s) => s.id !== session.id));
        setAvailable((prev) => [...prev, session]);
      }
    });
  }

  function handleUnlinkSession(session: SessionSummary) {
    setSessionError(null);
    // Optimistic update
    setLinked((prev) => prev.filter((s) => s.id !== session.id));
    setAvailable((prev) =>
      [...prev, session].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    );

    startLinkTransition(async () => {
      const result = await removeSessionFromChallenge(
        challenge.id,
        session.id
      );
      if (result?.error) {
        setSessionError(result.error);
        // Revert
        setAvailable((prev) => prev.filter((s) => s.id !== session.id));
        setLinked((prev) =>
          [...prev, session].sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime()
          )
        );
      }
    });
  }

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-6">
        <input type="hidden" name="challenge_id" value={challenge.id} />

        {(state?.error || deleteError) && (
          <div className="p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
            <p className="text-sm text-[#FF6130]">
              {state?.error || deleteError}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="title" className={LABEL}>
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
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="description" className={LABEL}>
            Description
            <span className="text-[#9CF0FF]/25 font-normal normal-case tracking-normal ml-2">
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
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className={LABEL}>
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              defaultValue={challenge.start_date}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="end_date" className={LABEL}>
              End Date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              defaultValue={challenge.end_date}
              className={INPUT}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className={LABEL}>
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
              className={INPUT}
            />
            <p className="text-[10px] text-[#9CF0FF]/25 mt-1.5">
              Must be &gt; 0 to publish.
            </p>
          </div>
          <div>
            <label htmlFor="capacity" className={LABEL}>
              Capacity
              <span className="text-[#9CF0FF]/25 font-normal normal-case tracking-normal ml-2">
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
              className={INPUT}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-3.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)] disabled:opacity-50 disabled:hover:scale-100"
          >
            {pending ? "Saving..." : "Save & Preview"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-3.5 rounded-full text-sm font-bold text-red-400/60 hover:text-red-400 border border-red-400/15 hover:border-red-400/30 transition-all font-headline disabled:opacity-50"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </form>

      {/* ── Session Linking ────────────────────────────────────── */}
      <div className="pt-6 border-t border-[#9CF0FF]/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className={LABEL}>Sessions</h2>
            <span className="text-[10px] font-bold text-[#9CF0FF]/30 bg-[#9CF0FF]/8 px-2 py-0.5 rounded-full font-headline">
              {linked.length}
            </span>
          </div>
          {available.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              disabled={linkPending}
              className="text-xs font-bold text-[#FF6130] hover:text-[#FF6130]/80 transition-colors font-headline disabled:opacity-50"
            >
              {showPicker ? "Cancel" : "+ Link Session"}
            </button>
          )}
        </div>

        {sessionError && (
          <div className="p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20 mb-3">
            <p className="text-sm text-[#FF6130]">{sessionError}</p>
          </div>
        )}

        <p className="text-[10px] text-[#9CF0FF]/25 mb-4">
          Minimum 3 draft sessions required. They will be published together
          with the challenge.
        </p>

        {/* Picker: available draft sessions */}
        {showPicker && (
          <div className="mb-4 p-4 rounded-xl bg-[#071318] border border-[#9CF0FF]/15">
            <p className="text-xs font-bold text-[#9CF0FF]/50 mb-3 font-headline">
              Your draft sessions
            </p>
            {available.length === 0 ? (
              <p className="text-xs text-[#9CF0FF]/30">
                No unlinked draft sessions available. Create new sessions from
                the Sessions page first.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {available.map((sess) => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => handleLinkSession(sess)}
                    disabled={linkPending}
                    className="w-full text-left p-3 rounded-lg bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#FF6130]/25 transition-colors group disabled:opacity-50"
                  >
                    <p className="text-sm font-bold text-white font-headline group-hover:text-[#FF6130] transition-colors">
                      {sess.title}
                    </p>
                    <p className="text-[10px] text-[#9CF0FF]/40 mt-0.5">
                      {new Date(sess.start_time).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      &middot; {sess.duration_minutes} min
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Linked sessions */}
        {linked.length > 0 ? (
          <div className="space-y-2">
            {linked.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white font-headline truncate">
                    {sess.title}
                  </p>
                  <p className="text-[10px] text-[#9CF0FF]/40 mt-0.5">
                    {new Date(sess.start_time).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    &middot; {sess.duration_minutes} min
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnlinkSession(sess)}
                  disabled={linkPending}
                  className="ml-3 p-1.5 rounded-lg text-[#9CF0FF]/30 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
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
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-[#9CF0FF]/10">
            <p className="text-xs text-[#9CF0FF]/30">
              No sessions linked yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
