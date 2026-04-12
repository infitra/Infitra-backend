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
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${dd}d`;
}

export function UpcomingSessionsStrip({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-3">
        Upcoming Sessions
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {sessions.map((sess) => (
          <Link
            key={sess.id}
            href={`/dashboard/sessions/${sess.id}`}
            className="shrink-0 w-52 rounded-xl overflow-hidden infitra-card-link group block"
          >
            <div className="aspect-[3/2] relative">
              {sess.image_url ? (
                <>
                  <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
                  <img src="/logo-mark.png" alt="" width={32} height={32} style={{ opacity: 0.1 }} />
                </div>
              )}
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-xs font-black font-headline text-white line-clamp-1 group-hover:text-[#FF6130]">{sess.title}</p>
              </div>
              <div className="absolute top-2 right-3">
                <span className="text-[10px] font-bold font-headline text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                  {formatRelative(sess.start_time)}
                </span>
              </div>
              {sess.challengeName && (
                <div className="absolute top-2 left-3">
                  <span className="text-[9px] font-bold font-headline text-[#FF6130] bg-black/50 px-2 py-0.5 rounded-full">
                    {sess.challengeName}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
