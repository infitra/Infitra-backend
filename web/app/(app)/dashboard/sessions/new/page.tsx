"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createAndPublishSession } from "@/app/actions/session";

const INPUT =
  "w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm";

const LABEL =
  "block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline";

export default function NewSessionPage() {
  const [state, action, pending] = useActionState(
    createAndPublishSession,
    null
  );

  return (
    <div className="py-10 max-w-2xl mx-auto">
      <Link
        href="/dashboard/sessions"
        className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-6 flex items-center gap-1.5 font-headline"
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
            d="M19 12H5M12 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All Sessions
      </Link>

      <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-2">
        Create Session
      </h1>
      <p className="text-sm text-[#9CF0FF]/40 mb-8">
        Fill in the details and publish. Nothing is saved until you publish.
      </p>

      <form action={action} className="space-y-6">
        {state?.error && (
          <div className="p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
            <p className="text-sm text-[#FF6130]">{state.error}</p>
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
            placeholder="e.g. Morning HIIT with Alex"
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
            placeholder="What will participants experience?"
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className={LABEL}>
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="time" className={LABEL}>
              Time
            </label>
            <input
              id="time"
              name="time"
              type="time"
              required
              defaultValue="10:00"
              className={INPUT}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration_minutes" className={LABEL}>
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
              className={INPUT}
            />
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
              placeholder="Unlimited"
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label htmlFor="price" className={LABEL}>
            Ticket Price (CHF)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min={0}
            step={0.5}
            defaultValue={0}
            className={INPUT}
          />
          <p className="text-[10px] text-[#9CF0FF]/25 mt-1.5">
            Price must be greater than 0 to publish.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)] disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Publishing..." : "Publish Session"}
        </button>
      </form>
    </div>
  );
}
