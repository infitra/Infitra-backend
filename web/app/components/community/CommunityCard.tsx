import Link from "next/link";

export function CommunityCard({
  type,
  spaceId,
  title,
  subtitle,
  memberCount,
}: {
  type: "creator" | "challenge";
  spaceId: string;
  title: string;
  subtitle: string;
  memberCount: number;
}) {
  const href =
    type === "creator"
      ? `/communities/creator/${spaceId}`
      : `/communities/challenge/${spaceId}`;

  const badge =
    type === "creator"
      ? {
          label: "COMMUNITY",
          color: "text-cyan-700 bg-cyan-100/80 border border-cyan-200",
        }
      : {
          label: "TRIBE",
          color: "text-orange-700 bg-orange-100/80 border border-orange-200",
        };

  return (
    <Link
      href={href}
      className="group block rounded-2xl infitra-card-link p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-headline ${badge.color}`}
        >
          {badge.label}
        </span>
        <span className="text-[10px]" style={{ color: "#94a3b8" }}>
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>
      </div>

      <h3 className="text-base font-black font-headline tracking-tight mb-1 truncate text-[#0F2229] group-hover:text-[#FF6130]">
        {title}
      </h3>

      <div className="flex items-center justify-between">
        <p className="text-xs truncate" style={{ color: "#64748b" }}>
          {subtitle}
        </p>
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          className="shrink-0 opacity-0 group-hover:opacity-60"
          style={{ color: "#0F2229" }}
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
