import Link from "next/link";

interface CommunityContainerProps {
  type: "creator" | "challenge";
  title: string;
  creatorName?: string;
  memberCount: number;
  spaceId: string;
  challengeTitle?: string;
  children: React.ReactNode;
}

/**
 * CommunityContainer — wraps a PostFeed inside a distinct "room" card.
 *
 * Gives the community a sense of place: header with title + member count,
 * divider, then the post feed inside. Used on the dashboard, and on
 * the standalone community/tribe pages.
 */
export function CommunityContainer({
  type,
  title,
  creatorName,
  memberCount,
  spaceId,
  challengeTitle,
  children,
}: CommunityContainerProps) {
  const href =
    type === "creator"
      ? `/communities/creator/${spaceId}`
      : `/communities/challenge/${spaceId}`;

  const badge =
    type === "creator"
      ? { label: "COMMUNITY", className: "text-cyan-700 bg-cyan-100/80" }
      : { label: "TRIBE", className: "text-orange-700 bg-orange-100/80" };

  return (
    <div className="rounded-2xl infitra-card overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-headline ${badge.className}`}
            >
              {badge.label}
            </span>
            <h2 className="text-base font-bold font-headline text-[#0F2229]">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#94a3b8] font-headline">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
            <Link
              href={href}
              className="text-[10px] font-bold font-headline text-[#FF6130] hover:opacity-80"
            >
              Open →
            </Link>
          </div>
        </div>
        {challengeTitle && (
          <p className="text-xs text-[#64748b]">{challengeTitle}</p>
        )}
        {creatorName && type === "creator" && (
          <p className="text-xs text-[#64748b]">by {creatorName}</p>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)" }} />

      {/* Content (PostFeed goes here) */}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
