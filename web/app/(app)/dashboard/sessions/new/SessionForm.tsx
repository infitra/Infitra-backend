"use client";

import { useActionState } from "react";
import { createSession } from "@/app/actions/session";
import Link from "next/link";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm";

const LABEL_CLASS =
  "block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline";

export function SessionForm() {
  const [state, action, pending] = useActionState(createSession, null);

  // Default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
          <p className="text-sm text-[#FF6130]">{state.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className={LABEL_CLASS}>
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          placeholder="e.g. Morning HIIT with Alex"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="description" className={LABEL_CLASS}>
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
          placeholder="What will participants experience?"
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className={LABEL_CLASS}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="time" className={LABEL_CLASS}>
            Time
          </label>
          <input
            id="time"
            name="time"
            type="time"
            required
            defaultValue="10:00"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration_minutes" className={LABEL_CLASS}>
            Duration (minutes)
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            required
            min={5}
            max={480}
            defaultValue={60}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="capacity" className={LABEL_CLASS}>
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
            placeholder="Unlimited"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label htmlFor="price" className={LABEL_CLASS}>
          Ticket Price (CHF)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          required
          min={0}
          step={0.5}
          defaultValue="0"
          className={INPUT_CLASS}
        />
        <p className="text-[10px] text-[#9CF0FF]/25 mt-1.5">
          Set to 0 for a free session. Price must be greater than 0 to publish.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-3.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)] disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Creating..." : "Create Draft"}
        </button>
        <Link
          href="/dashboard/sessions"
          className="px-6 py-3.5 rounded-full text-sm font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 transition-all font-headline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
