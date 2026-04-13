"use client";

interface Badge {
  badge_id: string;
  label: string;
  description: string | null;
  tier: string;
  color_hex: string | null;
  icon: string | null;
  awarded_at: string;
}

const tierColors: Record<string, string> = {
  common: "text-slate-700 bg-slate-100/80 border-slate-200",
  advanced: "text-sky-700 bg-sky-100/80 border-sky-200",
  rare: "text-violet-700 bg-violet-100/80 border-violet-200",
  epic: "text-orange-700 bg-orange-100/80 border-orange-200",
  legendary: "text-amber-700 bg-amber-100/80 border-amber-200",
  seasonal: "text-emerald-700 bg-emerald-100/80 border-emerald-200",
};

export function BadgesSection({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-3">
        Achievements · {badges.length}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {badges.map((b) => {
          const style = tierColors[b.tier] ?? tierColors.common;
          return (
            <div key={b.badge_id} className={`shrink-0 px-3 py-2 rounded-xl border ${style}`}>
              <p className="text-xs font-bold font-headline">{b.label}</p>
              {b.description && <p className="text-[10px] opacity-60 mt-0.5 max-w-[120px] truncate">{b.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
