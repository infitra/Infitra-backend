"use client";

import { useState } from "react";
import { BrandedCover } from "@/app/components/BrandedCover";

interface Session {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  start_time: string;
  duration_minutes: number;
}

export function SessionCard({ sess, idx }: { sess: Session; idx: number }) {
  const [open, setOpen] = useState(false);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="shrink-0 w-56 rounded-xl overflow-hidden infitra-card-link group block text-left">
        <div className="aspect-[3/2] relative">
          {sess.image_url ? (
            <>
              <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
            </>
          ) : (
            <BrandedCover size="sm" />
          )}
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-sm font-black font-headline text-white line-clamp-1 group-hover:text-[#FF6130]">{sess.title}</p>
          </div>
          <span className="absolute top-2 left-3 text-[10px] font-black text-white/50">#{idx + 1}</span>
        </div>
        <div className="p-3">
          {sess.description && <p className="text-xs mb-1 line-clamp-2" style={{ color: "#94a3b8" }}>{sess.description}</p>}
          <p className="text-[10px]" style={{ color: "#64748b" }}>
            {new Date(sess.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {formatTime(sess.start_time)} · {sess.duration_minutes} min
          </p>
        </div>
      </button>

      {/* Detail popup */}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden infitra-card">
            {/* Image */}
            <div className="aspect-[2/1] relative">
              {sess.image_url ? (
                <>
                  <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
                </>
              ) : (
                <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"><img src="/logo-mark.png" alt="" width={100} height={100} /></div>
                </div>
              )}
              <button onClick={() => setOpen(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="absolute bottom-3 left-4">
                <span className="text-xs font-black font-headline text-white/50">Session #{idx + 1}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h2 className="text-2xl font-black font-headline tracking-tight mb-2" style={{ color: "#0F2229" }}>{sess.title}</h2>

              {sess.description && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#64748b" }}>{sess.description}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(15,34,41,0.04)", border: "1px solid rgba(15,34,41,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-0.5" style={{ color: "rgba(15,34,41,0.45)" }}>Date</p>
                  <p className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>{formatDate(sess.start_time)}</p>
                </div>
                <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(15,34,41,0.04)", border: "1px solid rgba(15,34,41,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-0.5" style={{ color: "rgba(15,34,41,0.45)" }}>Time</p>
                  <p className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>{formatTime(sess.start_time)}</p>
                </div>
                <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(15,34,41,0.04)", border: "1px solid rgba(15,34,41,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-0.5" style={{ color: "rgba(15,34,41,0.45)" }}>Duration</p>
                  <p className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>{sess.duration_minutes} min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
