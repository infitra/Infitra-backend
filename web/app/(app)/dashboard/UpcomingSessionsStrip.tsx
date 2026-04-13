"use client";

import Link from "next/link";

interface SessionItem {
  id: string;
  title: string;
  image_url: string | null;
  start_time: string;
  challengeName: string | null;
}

function formatRelative(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const m = Math.floor((d.getTime() - now.getTime()) / 60000);
  const h = Math.floor(m / 60);
  const dd = Math.floor(h / 24);
  if (m < 0) return "Now";
  if (m < 60) return `In ${m}m`;
  if (h < 24) return `In ${h}h`;
  return `In ${dd}d`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function UpcomingSessionsStrip({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-3">
        Upcoming · {sessions.length} session{sessions.length !== 1 ? "s" : ""}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {sessions.map((sess) => {
          const relative = formatRelative(sess.start_time);
          return (
            <Link key={sess.id} href={`/dashboard/sessions/${sess.id}`} className="shrink-0 w-56 rounded-xl overflow-hidden infitra-card-link group block">
              {/* Image area */}
              <div className="aspect-[3/2] relative">
                {sess.image_url ? (
                  <>
                    <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 100%)" }} />
                  </>
                ) : (
                  <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"><img src="/logo-mark.png" alt="" width={36} height={36} /></div>
                  </div>
                )}

                {/* Challenge label — integrated into image */}
                {sess.challengeName && (
                  <div className="absolute top-0 left-0 right-0 p-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold font-headline text-white" style={{ backgroundColor: "rgba(255,97,48,0.85)" }}>
                      {sess.challengeName}
                    </span>
                  </div>
                )}

                {/* Title + time at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-black font-headline text-white line-clamp-1 group-hover:text-[#FF6130] mb-0.5">{sess.title}</p>
                  <p className="text-[10px] text-white/60">{formatDate(sess.start_time)} · {formatTime(sess.start_time)}</p>
                </div>

                {/* Countdown badge — bold, visible */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 rounded-lg text-xs font-black font-headline text-white" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                    {relative}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
