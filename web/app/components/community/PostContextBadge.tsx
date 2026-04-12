"use client";

import Link from "next/link";

/**
 * PostContextBadge — shows the linked event as a rich card above the post.
 */
export function PostContextBadge({
  contextType,
  contextTitle,
  contextImageUrl,
  contextId,
}: {
  contextType: "session" | "challenge";
  contextTitle: string;
  contextImageUrl?: string | null;
  contextId: string;
}) {
  const href = contextType === "session" ? `/sessions/${contextId}` : `/challenges/${contextId}`;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl mb-2 group"
      style={{ backgroundColor: "rgba(255,97,48,0.04)", border: "1px solid rgba(255,97,48,0.12)" }}
    >
      {contextImageUrl ? (
        <img src={contextImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}>
          <img src="/logo-mark.png" alt="" width={16} height={16} style={{ opacity: 0.15 }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130]">
          {contextType === "challenge" ? "Challenge" : "Session"}
        </p>
        <p className="text-sm font-bold font-headline text-[#0F2229] truncate group-hover:text-[#FF6130]">{contextTitle}</p>
      </div>
      <span className="text-xs font-bold text-[#FF6130] shrink-0">View →</span>
    </Link>
  );
}
