import Link from "next/link";
import type { ProgramSummary } from "./page";

/**
 * OtherProgramCard — a collaboration that isn't live yet (draft, awaiting
 * signatures) or has wrapped (completed). Deliberately NOT a product card: a
 * draft has a different job than a published experience, so it leads with the
 * two things that matter while it's in motion —
 *   WHO it's with   (the partner)  and
 *   STATE + NEXT     (where it is in the process, and the one next step).
 * No cover. The title is a quiet subtitle, not the headline. Whole card is one
 * click to its destination:
 *   drafting-* / awaiting-signatures → workspace
 *   completed                        → experience space (read-only)
 */

interface UserLite {
  name: string;
  avatar: string | null;
  initial: string;
}

interface Props {
  program: ProgramSummary;
  user: UserLite;
}

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const SLATE = "#64748b";

const SIGN_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 19h18" />
    <path d="M5 15l9-9a1.5 1.5 0 0 1 2 2l-9 9-3 1Z" />
  </svg>
);
const EDIT_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const WAIT_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const CHECK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const stageConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; cta: string }
> = {
  "drafting-solo": {
    label: "Awaiting partner",
    color: CYAN,
    icon: WAIT_ICON,
    cta: "Open workspace →",
  },
  "drafting-jointly": {
    label: "Drafting together",
    color: CYAN,
    icon: EDIT_ICON,
    cta: "Open workspace →",
  },
  "awaiting-signatures": {
    label: "Awaiting signatures",
    color: ORANGE,
    icon: SIGN_ICON,
    cta: "Review contract →",
  },
  completed: {
    label: "Completed",
    color: SLATE,
    icon: CHECK_ICON,
    cta: "Open experience →",
  },
};

function destinationFor(p: ProgramSummary): string {
  if (p.stage === "completed") {
    return p.spaceId ? `/experiences/${p.id}/space` : `/experiences/${p.id}`;
  }
  return `/dashboard/collaborate/${p.id}`;
}

function Avatar({ src, initial, accent, dim }: { src: string | null; initial: string; accent: string; dim?: boolean }) {
  return (
    <span
      className="w-7 h-7 rounded-full overflow-hidden inline-flex items-center justify-center shrink-0"
      style={{
        border: "2px solid #FFFFFF",
        backgroundColor: src ? "transparent" : `${accent}22`,
        opacity: dim ? 0.55 : 1,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-black font-headline" style={{ color: accent }}>
          {initial}
        </span>
      )}
    </span>
  );
}

export function OtherProgramCard({ program, user }: Props) {
  const cfg = stageConfig[program.stage] ?? stageConfig["drafting-jointly"];
  const isUntitled =
    !program.title ||
    program.title === "Untitled Challenge" ||
    program.title === "Untitled Collaboration";
  const partner = program.partner;

  return (
    <Link
      href={destinationFor(program)}
      className="group block w-full h-full rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor: "#FFFFFF",
        borderLeft: `3px solid ${cfg.color}`,
        boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 20px rgba(15,34,41,0.08)",
      }}
    >
      {/* WHO — the partner this collaboration is with. */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center">
          <Avatar src={user.avatar} initial={user.initial} accent={ORANGE} />
          {partner && (
            <span className="-ml-2">
              <Avatar
                src={partner.avatar}
                initial={(partner.name?.[0] ?? "?").toUpperCase()}
                accent={CYAN}
                dim={partner.pendingInvite}
              />
            </span>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: SLATE }}>
          {partner ? (
            <>
              with <span style={{ color: "#0F2229", fontWeight: 600 }}>{partner.name}</span>
              {partner.pendingInvite && (
                <span className="ml-1.5 text-[9px] uppercase tracking-widest" style={{ color: ORANGE, fontWeight: 700 }}>
                  · pending
                </span>
              )}
            </>
          ) : (
            "Awaiting a partner"
          )}
        </p>
      </div>

      {/* STATE — where this is in the process (the loud part). */}
      <div className="flex items-center gap-1.5 mt-3.5" style={{ color: cfg.color }}>
        {cfg.icon}
        <span className="text-[13px] font-black font-headline">{cfg.label}</span>
      </div>

      {/* Title — a quiet subtitle, not the headline. */}
      <p
        className="text-xs mt-1 truncate"
        style={{
          color: "#94a3b8",
          fontStyle: isUntitled ? "italic" : "normal",
        }}
      >
        {isUntitled ? "Untitled experience" : program.title}
      </p>

      {/* NEXT STEP. */}
      <p
        className="text-[11px] uppercase tracking-widest font-headline mt-3.5 transition-colors group-hover:text-[#FF6130]"
        style={{ color: "#0F2229", fontWeight: 700 }}
      >
        {cfg.cta}
      </p>
    </Link>
  );
}
