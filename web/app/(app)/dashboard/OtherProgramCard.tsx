import Link from "next/link";
import type { ProgramSummary } from "./page";

/**
 * OtherProgramCard — a program that isn't live yet (draft, awaiting-signatures)
 * or has wrapped (completed). A real card with a cover, a clear state, and the
 * one next step — not a footnote. Whole card is one click to its destination:
 *   drafting-* / awaiting-signatures → workspace
 *   completed                        → challenge space (read-only)
 */

interface Props {
  program: ProgramSummary;
}

const stageConfig: Record<
  string,
  { label: string; color: string; chipBg: string; cta: string; hint: string }
> = {
  "drafting-solo": {
    label: "Awaiting partner",
    color: "#FF6130",
    chipBg: "rgba(255,97,48,0.95)",
    cta: "Open workspace →",
    hint: "Invite a collaborator to begin",
  },
  "drafting-jointly": {
    label: "Drafting",
    color: "#0891b2",
    chipBg: "rgba(8,145,178,0.95)",
    cta: "Open workspace →",
    hint: "Shaping the program together",
  },
  "awaiting-signatures": {
    label: "Awaiting signatures",
    color: "#0891b2",
    chipBg: "rgba(8,145,178,0.95)",
    cta: "Review contract →",
    hint: "Terms are locked for review",
  },
  completed: {
    label: "Completed",
    color: "#475569",
    chipBg: "rgba(15,34,41,0.85)",
    cta: "Open program →",
    hint: "Wrapped up",
  },
};

function destinationFor(p: ProgramSummary): string {
  if (p.stage === "completed") {
    return p.spaceId ? `/experiences/${p.id}/space` : `/experiences/${p.id}`;
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
      className="group block rounded-2xl overflow-hidden infitra-card-link flex flex-col"
      style={{ border: "1px solid rgba(15,34,41,0.08)" }}
    >
      {/* Cover banner — gives the in-progress program real presence. */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "16 / 9",
          backgroundColor: "#0F2229",
          backgroundImage: program.imageUrl ? `url(${program.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!program.imageUrl && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,97,48,0.40), rgba(8,145,178,0.40)), #0F2229",
            }}
          />
        )}
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] font-headline backdrop-blur-sm"
          style={{ backgroundColor: cfg.chipBg, color: "#FFFFFF", fontWeight: 800 }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3
          className="text-base font-black font-headline tracking-tight truncate group-hover:text-[#FF6130] transition-colors"
          style={{
            color: "#0F2229",
            fontStyle: isUntitled ? "italic" : "normal",
            opacity: isUntitled ? 0.8 : 1,
          }}
        >
          {isUntitled ? "Untitled" : program.title}
        </h3>

        {program.partner ? (
          <div className="flex items-center gap-2 mt-2.5">
            {program.partner.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={program.partner.avatar}
                alt=""
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(8,145,178,0.15)" }}
              >
                <span className="text-[10px] font-black font-headline" style={{ color: "#0891b2" }}>
                  {(program.partner.name?.[0] ?? "?").toUpperCase()}
                </span>
              </div>
            )}
            <p className="text-xs truncate" style={{ color: "#64748b" }}>
              with{" "}
              <span style={{ color: "#0F2229", fontWeight: 600 }}>{program.partner.name}</span>
              {program.partner.pendingInvite && (
                <span
                  className="ml-1.5 text-[9px] uppercase tracking-widest"
                  style={{ color: "#FF6130", fontWeight: 700 }}
                >
                  · pending
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-xs mt-2.5" style={{ color: "#94a3b8" }}>
            {cfg.hint}
          </p>
        )}

        <p
          className="text-[11px] uppercase tracking-widest font-headline mt-auto pt-3 transition-colors group-hover:text-[#FF6130]"
          style={{ color: cfg.color, fontWeight: 700 }}
        >
          {cfg.cta}
        </p>
      </div>
    </Link>
  );
}
