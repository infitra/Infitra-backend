"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateSession, deleteSession } from "@/app/actions/session";
import Link from "next/link";

const INPUT =
  "w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm";

const LABEL =
  "block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline";

interface Session {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  duration_minutes: number;
  capacity: number | null;
  price_cents: number;
}

export function SessionEditForm({ session }: { session: Session }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const result = await updateSession(prev, fd);
    if (result?.success) {
      router.push(`/dashboard/sessions/${session.id}/preview`);
    }
    return result;
  }, null);

  const startDate = new Date(session.start_time);
  const defaultDate = startDate.toISOString().split("T")[0];
  const defaultTime = startDate.toTimeString().slice(0, 5);
  const priceCHF = session.price_cents / 100;

  async function handleDelete() {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteSession(session.id);
    if (result?.error) {
      setDeleteError(result.error);
      setDeleting(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="session_id" value={session.id} />

      {(state?.error || deleteError) && (
        <div className="p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
          <p className="text-sm text-[#FF6130]">{state?.error || deleteError}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className={LABEL}>Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          defaultValue={session.title === "Untitled Session" ? "" : session.title}
          placeholder="e.g. Morning HIIT with Alex"
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor="description" className={LABEL}>
          Description
          <span className="text-[#9CF0FF]/25 font-normal normal-case tracking-normal ml-2">optional</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={session.description ?? ""}
          placeholder="What will participants experience?"
          className={`${INPUT} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className={LABEL}>Date</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="time" className={LABEL}>Time</label>
          <input
            id="time"
            name="time"
            type="time"
            required
            defaultValue={defaultTime}
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration_minutes" className={LABEL}>Duration (minutes)</label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            required
            min={5}
            max={480}
            defaultValue={session.duration_minutes}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="capacity" className={LABEL}>
            Capacity
            <span className="text-[#9CF0FF]/25 font-normal normal-case tracking-normal ml-2">optional</span>
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={10000}
            defaultValue={session.capacity ?? ""}
            placeholder="Unlimited"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label htmlFor="price" className={LABEL}>Ticket Price (CHF)</label>
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
          Price must be greater than 0 to publish. Set to 0 for a free session.
        </p>
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
  );
}
