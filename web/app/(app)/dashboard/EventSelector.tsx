"use client";

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
  if (events.length === 0) return null;

  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-2">
        Post about an event <span className="font-normal normal-case tracking-normal text-[#94a3b8]/60">(optional)</span>
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {events.map((ev) => {
          const isSelected = selected?.id === ev.id && selected?.type === ev.type;
          return (
            <button
              key={`${ev.type}-${ev.id}`}
              type="button"
              onClick={() => onSelect(isSelected ? null : { type: ev.type, id: ev.id })}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-headline ${
                isSelected ? "text-white" : "text-[#0F2229]"
              }`}
              style={
                isSelected
                  ? { backgroundColor: "#FF6130" }
                  : { backgroundColor: "rgba(255,255,255,0.78)", border: "1px solid rgba(0,0,0,0.08)" }
              }
            >
              {ev.imageUrl && <img src={ev.imageUrl} alt="" className="w-4 h-4 rounded object-cover" />}
              <span className="truncate max-w-[120px]">{ev.title}</span>
              <span className="text-[9px] opacity-60">{ev.type === "session" ? "📅" : "🏋️"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
