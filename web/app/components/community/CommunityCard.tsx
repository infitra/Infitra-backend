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
      ? { label: "COMMUNITY", color: "text-[#9CF0FF]/60 bg-[#9CF0FF]/10" }
      : { label: "TRIBE", color: "text-[#FF6130]/60 bg-[#FF6130]/10" };

  return (
    <Link
      href={href}
      className="group block rounded-2xl glass-card-action overflow-hidden"
    >
      <div
        className={`h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity ${
          type === "creator"
            ? "from-[#9CF0FF]/40 to-[#9CF0FF]/10"
            : "from-[#FF6130] to-[#FF6130]/20"
        }`}
      />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-headline ${badge.color}`}
          >
            {badge.label}
          </span>
          <span className="text-[10px] text-[#9CF0FF]/20">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>

        <h3 className="text-base font-black text-white font-headline tracking-tight mb-1 group-hover:text-[#FF6130] transition-colors truncate">
          {title}
        </h3>

        <p className="text-xs text-[#9CF0FF]/35 truncate">{subtitle}</p>
      </div>
    </Link>
  );
}
