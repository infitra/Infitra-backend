"use client";

import { useState } from "react";

interface EventItem {
  id: string;
  type: "session" | "challenge";
  title: string;
  imageUrl: string | null;
}

export function EventSelector({
  events,
  selected,
  onSelect,
}: {
  events: EventItem[];
  selected: { type: "session" | "challenge"; id: string } | null;
  onSelect: (sel: { type: "session" | "challenge"; id: string } | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"challenge" | "session">("challenge");

  const challenges = events.filter((e) => e.type === "challenge");
  const sessions = events.filter((e) => e.type === "session");
  const selectedEvent = selected ? events.find((e) => e.id === selected.id && e.type === selected.type) : null;

  return (
    <div className="mb-4">
      {/* Selected event display or add button */}
      {selectedEvent ? (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,97,48,0.06)", border: "1px solid rgba(255,97,48,0.20)" }}>
          {selectedEvent.imageUrl && <img src={selectedEvent.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130]">{selectedEvent.type === "challenge" ? "Challenge" : "Session"}</p>
            <p className="text-sm font-bold font-headline text-[#0F2229] truncate">{selectedEvent.title}</p>
          </div>
          <button onClick={() => onSelect(null)} className="text-xs text-[#94a3b8] hover:text-[#0F2229] shrink-0">✕</button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-headline text-[#FF6130] mb-3"
          style={{ border: "1px dashed rgba(255,97,48,0.30)", backgroundColor: "rgba(255,97,48,0.03)" }}
        >
          <span className="text-base">+</span>
          Add Context
          <span className="font-normal text-[#94a3b8] ml-1">(challenge or session)</span>
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[70vh] rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: "#FEFEFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <h3 className="text-base font-bold font-headline text-[#0F2229]">Add Context to Post</h3>
              <button onClick={() => setOpen(false)} className="text-[#94a3b8] hover:text-[#0F2229]">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-5 pt-3 gap-1">
              <button onClick={() => setTab("challenge")} className={`px-4 py-2 rounded-lg text-xs font-bold font-headline ${tab === "challenge" ? "bg-[#FF6130] text-white" : "text-[#64748b]"}`}>
                Challenges ({challenges.length})
              </button>
              <button onClick={() => setTab("session")} className={`px-4 py-2 rounded-lg text-xs font-bold font-headline ${tab === "session" ? "bg-[#0891b2] text-white" : "text-[#64748b]"}`}>
                Sessions ({sessions.length})
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {(tab === "challenge" ? challenges : sessions).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => { onSelect({ type: ev.type, id: ev.id }); setOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left group"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {ev.imageUrl ? (
                    <img src={ev.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}>
                      <img src="/logo-mark.png" alt="" width={20} height={20} style={{ opacity: 0.15 }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-headline text-[#0F2229] truncate group-hover:text-[#FF6130]">{ev.title}</p>
                    <p className="text-[10px] text-[#94a3b8] uppercase font-bold font-headline">{ev.type}</p>
                  </div>
                  <span className="text-xs text-[#FF6130] font-bold shrink-0 opacity-0 group-hover:opacity-100">Select</span>
                </button>
              ))}
              {(tab === "challenge" ? challenges : sessions).length === 0 && (
                <p className="text-sm text-[#94a3b8] text-center py-8">No {tab}s available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
