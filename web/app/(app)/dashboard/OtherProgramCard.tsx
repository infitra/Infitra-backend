import Link from "next/link";
import type { ProgramSummary } from "./page";

/**
 * OtherProgramCard — compact card for programs that aren't currently
 * "active" (drafts, awaiting-signatures, completed).
 *
 * One card = one program = one click → its appropriate destination:
 *   drafting-* / awaiting-signatures → workspace
 *   completed                        → challenge space (read-only)
 *
 * The whole card is clickable. State badge + cover thumb + title +
 * partner row + single primary action label.
 */

interface Props {
  program: ProgramSummary;
}

const stageConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; cta: string }
> = {
  "drafting-solo": {
    label: "Awaiting partner",
    color: "#FF6130",
    bg: "rgba(255,97,48,0.10)",
    border: "rgba(255,97,48,0.25)",
    cta: "Open workspace →",
  },
  "drafting-jointly": {
    label: "Drafting",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.10)",
    border: "rgba(8,145,178,0.25)",
    cta: "Open workspace →",
  },
  "awaiting-signatures": {
    label: "Awaiting signatures",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.10)",
    border: "rgba(8,145,178,0.25)",
    cta: "Review contract →",
  },
  completed: {
    label: "Completed",
    color: "#475569",
    bg: "rgba(15,34,41,0.06)",
    border: "rgba(15,34,41,0.12)",
    cta: "Open program →",
  },
};

function destinationFor(p: ProgramSummary): string {
  if (p.stage === "completed") {
    return p.spaceId
      ? `/communities/challenge/${p.spaceId}`
      : `/challenges/${p.id}`;
  }
  return `/dashboard/collaborate/${p.id}`;
}

export function OtherProgramCard({ program }: Props) {
  const cfg = stageConfig[program.stage] ?? stageConfig["drafting-jointly"];
  const isUntitled =
    !program.title ||
    program.title === "Untitled Challenge" ||
    program.title === "Untitled Collaboration";

  return (
    <Link
      href={destinationFor(program)}
      className="group block rounded-2xl overflow-hidden infitra-card-link"
      style={{ border: "1px solid rgba(15,34,41,0.08)" }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Cover thumb */}
        {program.imageUrl ? (
          <img
            src={program.imageUrl}
            alt=""
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,97,48,0.15), rgba(8,145,178,0.15))",
            }}
          >
            <span className="text-base font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>
              {(program.title?.[0] ?? "?").toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p
              className="text-sm font-headline truncate group-hover:text-[#FF6130] transition-colors"
              style={{
                color: "#0F2229",
                fontWeight: 700,
                fontStyle: isUntitled ? "italic" : "normal",
                opacity: isUntitled ? 0.75 : 1,
              }}
            >
              {isUntitled ? "Untitled" : program.title}
            </p>
            <span
              className="shrink-0 text-[9px] uppercase tracking-widest font-headline px-2 py-0.5 rounded-full"
              style={{
                color: cfg.color,
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
                fontWeight: 700,
              }}
            >
              {cfg.label}
            </span>
          </div>

          {program.partner && (
            <p className="text-[11px] truncate" style={{ color: "#64748b" }}>
              with{" "}
              <span style={{ color: "#0F2229", fontWeight: 600 }}>
                {program.partner.name}
              </span>
              {program.partner.pendingInvite && (
                <span
                  className="ml-1.5 text-[9px] uppercase tracking-widest"
                  style={{ color: "#FF6130", fontWeight: 700 }}
                >
                  · pending
                </span>
              )}
            </p>
          )}

          <p
            className="text-[10px] uppercase tracking-widest font-headline mt-2 transition-colors group-hover:text-[#FF6130]"
            style={{ color: cfg.color, fontWeight: 700 }}
          >
            {cfg.cta}
          </p>
        </div>
      </div>
    </Link>
  );
}
