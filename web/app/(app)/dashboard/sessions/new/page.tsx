"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createAndPublishSession } from "@/app/actions/session";
import { ImageSelector } from "@/app/components/ImageSelector";

const INPUT_CLASS = "w-full px-4 py-3 rounded-xl focus:outline-none text-sm";
const INPUT_STYLE: React.CSSProperties = { backgroundColor: "rgba(255, 255, 255, 0.78)", border: "1px solid rgba(15, 34, 41, 0.15)", color: "#0F2229" };
const LABEL = "block text-xs font-bold uppercase tracking-wider mb-2 font-headline";
const LABEL_STYLE: React.CSSProperties = { color: "rgba(15, 34, 41, 0.55)" };

export default function NewSessionPage() {
  const [state, action, pending] = useActionState(createAndPublishSession, null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  return (
    <div className="py-10 max-w-2xl mx-auto">
      <Link href="/dashboard/create" className="text-xs mb-6 flex items-center gap-1.5 font-headline" style={{ color: "#64748b" }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back
      </Link>

      <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-2" style={{ color: "#0F2229" }}>Create Session</h1>
      <p className="text-sm mb-8" style={{ color: "#64748b" }}>Fill in the details and publish.</p>

      <form action={action} className="space-y-6">
        {state?.error && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255, 97, 48, 0.10)", border: "1px solid rgba(255, 97, 48, 0.30)" }}>
            <p className="text-sm" style={{ color: "#FF6130" }}>{state.error}</p>
          </div>
        )}

        {/* Cover Image */}
        <div>
          <label className={LABEL} style={LABEL_STYLE}>
            Cover Image
            <span className="font-normal normal-case tracking-normal ml-2" style={{ color: "#94a3b8" }}>recommended</span>
          </label>
          <ImageSelector currentUrl={imageUrl} title={title || "Session"} onSelect={setImageUrl} size="md" />
          <input type="hidden" name="image_url" value={imageUrl ?? ""} />
        </div>

        <div>
          <label htmlFor="title" className={LABEL} style={LABEL_STYLE}>Title</label>
          <input id="title" name="title" type="text" required minLength={3} maxLength={120} placeholder="e.g. Morning HIIT with Alex" className={INPUT_CLASS} style={INPUT_STYLE} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label htmlFor="description" className={LABEL} style={LABEL_STYLE}>
            Description <span className="font-normal normal-case tracking-normal ml-2" style={{ color: "#94a3b8" }}>optional</span>
          </label>
          <textarea id="description" name="description" rows={3} maxLength={2000} placeholder="What will participants experience?" className={`${INPUT_CLASS} resize-none`} style={INPUT_STYLE} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className={LABEL} style={LABEL_STYLE}>Date</label>
            <input id="date" name="date" type="date" required className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
          <div>
            <label htmlFor="time" className={LABEL} style={LABEL_STYLE}>Time</label>
            <input id="time" name="time" type="time" required defaultValue="10:00" className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration_minutes" className={LABEL} style={LABEL_STYLE}>Duration (minutes)</label>
            <input id="duration_minutes" name="duration_minutes" type="number" required min={5} max={480} defaultValue={60} className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
          <div>
            <label htmlFor="capacity" className={LABEL} style={LABEL_STYLE}>
              Capacity <span className="font-normal normal-case tracking-normal ml-2" style={{ color: "#94a3b8" }}>optional</span>
            </label>
            <input id="capacity" name="capacity" type="number" min={1} max={10000} placeholder="Unlimited" className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
        </div>

        <div>
          <label htmlFor="price" className={LABEL} style={LABEL_STYLE}>Ticket Price (CHF)</label>
          <input id="price" name="price" type="number" required min={0} step={0.5} defaultValue={0} className={INPUT_CLASS} style={INPUT_STYLE} />
          <p className="text-[10px] mt-1.5" style={{ color: "#94a3b8" }}>Price must be greater than 0 to publish.</p>
        </div>

        <button type="submit" disabled={pending} className="w-full py-3.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-50" style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}>
          {pending ? "Publishing..." : "Publish Session"}
        </button>
      </form>
    </div>
  );
}
