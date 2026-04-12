"use client";

import Link from "next/link";

/**
 * PostContextBadge — shows the linked event on a post.
 * Renders as a compact pill above the post body.
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
  const icon = contextType === "session" ? "📅" : "🏋️";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-2 group"
      style={{ backgroundColor: "rgba(255, 97, 48, 0.06)", border: "1px solid rgba(255, 97, 48, 0.15)" }}
    >
      {contextImageUrl && (
        <img src={contextImageUrl} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
      )}
      <span className="text-[10px]">{icon}</span>
      <span className="text-xs font-bold font-headline text-[#FF6130] group-hover:underline truncate max-w-[200px]">
        {contextTitle}
      </span>
    </Link>
  );
}
