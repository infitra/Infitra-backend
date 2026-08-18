"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useBackdropClose } from "@/app/components/useBackdropClose";
import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { StatCard, STAT_ICONS, BRAND_ACCENT } from "@/app/components/StatCards";
import { useOverlay } from "@/app/components/DashboardOverlay";

/**
 * ProfileModal + ProfileTrigger — THE profile surface (social layer).
 * Every display name and avatar in the product wraps in a ProfileTrigger;
 * clicking opens this modal.
 *
 * Design pass (founder's polish round): the modal joins the product's visual
 * language instead of listing content —
 *   HEADER   — brand-gradient wash band (same grammar as the experience
 *              header), avatar overlapping the band edge, ONE identity badge
 *              (Founding Expert stands alone, gold; it outranks Expert).
 *   YOU & X  — the relational strip, first. On your OWN profile it becomes a
 *              placeholder explaining what others see here.
 *   FACTS    — structured chips: quiet icon + text, bordered, cream.
 *   PROOF    — "On INFITRA" as a tiled band: big headline numbers over small
 *              labels, hairline dividers. The most persuasive section, so it
 *              finally looks like it.
 *
 * Data: one call to load_public_profile. Private profiles come back
 * `limited`: name, photo and the shared strip only.
 * Mount ONE <ProfileModalHost> per page region; triggers below it open the
 * shared modal via context.
 */

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const GOLD = "#EAB308";

interface SharedStrip {
  count: number;
  active_titles: string[];
  completed_titles: string[];
}

interface ProfilePayload {
  exists: boolean;
  limited?: boolean;
  profile_id?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  bio?: string | null;
  tagline?: string | null;
  is_founding_expert?: boolean;
  facts?: {
    age?: number;
    city?: string;
    training_since?: number;
    disciplines?: string[];
    focus?: string;
  };
  shared?: SharedStrip;
  credentials?: Array<{
    id: string;
    kind: string;
    title: string;
    org: string | null;
    year: number | null;
    year_end: number | null;
  }>;
  proof?: {
    avg_rating?: number;
    total_reviews?: number;
    tribe_count?: number;
    active_tribe_members?: number;
    hosting_count?: number;
    sessions_led?: number;
    questions_answered?: number;
    tribes_count?: number;
    completed_count?: number;
    sessions_attended?: number;
  };
}

const ProfileModalCtx = createContext<((profileId: string) => void) | null>(null);

export function ProfileTrigger({
  profileId,
  children,
  className,
}: {
  profileId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const open = useContext(ProfileModalCtx);
  if (!open) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        open(profileId);
      }}
      className={className ?? "inline-flex items-start gap-2 text-left cursor-pointer self-start"}
      aria-haspopup="dialog"
      aria-label="View profile"
    >
      {children}
    </button>
  );
}

export function ProfileModalHost({
  children,
  selfStatLinks = false,
}: {
  children: React.ReactNode;
  /** Opt-in: makes YOUR OWN proof cards open the People / Reviews overlays.
   *  Only true where those panels are actually mounted (the dashboard
   *  console) — elsewhere the click would be a dead end, which is exactly
   *  the failure mode we removed from "Needs you". */
  selfStatLinks?: boolean;
}) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const open = useCallback((id: string) => {
    setPayload(null);
    setProfileId(id);
  }, []);
  const close = useCallback(() => setProfileId(null), []);
  const backdrop = useBackdropClose(close);

  useEffect(() => {
    if (!profileId) return;
    let alive = true;
    (async () => {
      const supabase = createClient();
      const [{ data, error }, { data: auth }] = await Promise.all([
        supabase.rpc("load_public_profile", { p_profile_id: profileId }),
        supabase.auth.getUser(),
      ]);
      if (alive) {
        setViewerId(auth?.user?.id ?? null);
        setPayload(error ? { exists: false } : ((data ?? { exists: false }) as ProfilePayload));
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [profileId, close]);

  return (
    <ProfileModalCtx.Provider value={open}>
      {children}
      {mounted &&
        profileId &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(15,34,41,0.45)" }}
            {...backdrop}
            role="dialog"
            aria-modal="true"
            aria-label="Profile"
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: "#FFFFFF",
                maxHeight: "min(84vh, 700px)",
                boxShadow: "0 24px 60px rgba(15,34,41,0.28)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalBody payload={payload} viewerId={viewerId} onClose={close} selfStatLinks={selfStatLinks} />
            </div>
          </div>,
          document.body,
        )}
    </ProfileModalCtx.Provider>
  );
}

// ─── Body ────────────────────────────────────────────────────

function ModalBody({
  payload,
  viewerId,
  onClose,
  selfStatLinks = false,
}: {
  payload: ProfilePayload | null;
  viewerId: string | null;
  onClose: () => void;
  selfStatLinks?: boolean;
}) {
  // Safe outside an OverlayHost (returns a no-op); selfStatLinks is what
  // actually gates whether we render these as clickable at all.
  const openOverlay = useOverlay();

  if (!payload) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-xs" style={{ color: "#94a3b8" }}>Loading…</p>
      </div>
    );
  }
  if (!payload.exists) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-xs" style={{ color: "#94a3b8" }}>This profile is not available.</p>
      </div>
    );
  }

  const isExpert = payload.role === "creator";
  const isSelf = !!viewerId && payload.profile_id === viewerId;
  const firstName = (payload.display_name ?? "them").split(" ")[0];
  const shared = payload.shared;
  const proof = payload.proof ?? {};
  const facts = payload.facts ?? {};

  // ONE identity badge — Founding Expert outranks Expert.
  const badge = payload.is_founding_expert
    ? { label: "★ Founding Expert", color: "#92700c", bg: "rgba(234,179,8,0.13)", border: "rgba(234,179,8,0.4)" }
    : isExpert
      ? { label: "Expert", color: "#c2410c", bg: "rgba(255,97,48,0.10)", border: "rgba(255,97,48,0.22)" }
      : { label: "Tribe member", color: CYAN, bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.20)" };

  // Proof cards — the same designed family the console rails use, on brand:
  // orange = what they run, cyan = their people/answers, gold = stars only.
  // Proof cards, ordered so the two people-numbers sit together, then what
  // they run, then reputation. Orange = active, cyan = accumulated.
  // On YOUR OWN profile (and only where the panels are mounted), the two
  // cards that have somewhere to go become doors: connections opens your
  // people, reviews opens your reviews. This is what lets the console drop
  // its "At a glance" block — the numbers live here, with context.
  const selfDoors = selfStatLinks && isSelf;
  const proofCards: Array<{
    icon: React.ReactNode; value: string; label: string; accent: string;
    sub?: string; onClick?: () => void;
  }> = isExpert
    ? [
        { icon: STAT_ICONS.people, value: `${proof.active_tribe_members ?? 0}`, label: "active tribe members", accent: BRAND_ACCENT.orange, sub: selfDoors ? "in your live experiences" : undefined },
        {
          icon: STAT_ICONS.people,
          value: `${proof.tribe_count ?? 0}`,
          label: "tribe connections",
          accent: BRAND_ACCENT.cyan,
          sub: selfDoors ? "everyone you have run with" : undefined,
          onClick: selfDoors ? () => { onClose(); openOverlay("people"); } : undefined,
        },
        { icon: STAT_ICONS.flame, value: `${proof.hosting_count ?? 0}`, label: proof.hosting_count === 1 ? "experience led" : "experiences led", accent: BRAND_ACCENT.orange },
        { icon: STAT_ICONS.bolt, value: `${proof.sessions_led ?? 0}`, label: "sessions led", accent: BRAND_ACCENT.orange },
        { icon: STAT_ICONS.check, value: `${proof.questions_answered ?? 0}`, label: "questions answered", accent: BRAND_ACCENT.orange },
        ...((proof.total_reviews ?? 0) > 0
          ? [{
              icon: STAT_ICONS.star,
              value: `★ ${Number(proof.avg_rating ?? 0).toFixed(1)}`,
              label: `${proof.total_reviews} ${proof.total_reviews === 1 ? "review" : "reviews"}`,
              accent: BRAND_ACCENT.cyan,
              sub: selfDoors ? "read them all" : undefined,
              onClick: selfDoors ? () => { onClose(); openOverlay("reviews"); } : undefined,
            }]
          : []),
      ]
    : payload.limited || proof.tribes_count === undefined
      ? []
      : [
          { icon: STAT_ICONS.flame, value: `${proof.tribes_count ?? 0}`, label: proof.tribes_count === 1 ? "experience joined" : "experiences joined", accent: BRAND_ACCENT.orange },
          { icon: STAT_ICONS.live, value: `${proof.sessions_attended ?? 0}`, label: "live sessions attended", accent: BRAND_ACCENT.orange },
          { icon: STAT_ICONS.check, value: `${proof.completed_count ?? 0}`, label: "completed", accent: BRAND_ACCENT.cyan },
        ];

  const factChips: Array<{ icon: React.ReactNode; text: string }> = [];
  if (facts.city) factChips.push({ icon: PIN_ICON, text: facts.city });
  if (facts.age) factChips.push({ icon: PERSON_ICON, text: `${facts.age}` });
  if (facts.training_since) factChips.push({ icon: CAL_ICON, text: `Training since ${facts.training_since}` });
  for (const d of (facts.disciplines ?? []).slice(0, 4)) factChips.push({ icon: BOLT_ICON, text: d });

  return (
    <>
      {/* HEADER — gradient wash band; avatar overlaps its bottom edge. */}
      <div className="relative shrink-0">
        <div
          className="h-20"
          style={{
            backgroundImage:
              "linear-gradient(112deg, rgba(8,145,178,0.20) 0%, rgba(156,240,255,0.10) 30%, rgba(242,239,232,0.6) 55%, rgba(255,140,90,0.12) 78%, rgba(255,97,48,0.22) 100%)",
          }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(15,34,41,0.08)]"
          style={{ backgroundColor: "rgba(255,255,255,0.65)" }}
          aria-label="Close"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2.5} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="px-5 pb-4 -mt-9 flex items-end gap-3.5">
          <ModalAvatar src={payload.avatar_url ?? null} name={payload.display_name ?? "?"} expert={isExpert} founding={!!payload.is_founding_expert} />
          <div className="min-w-0 flex-1 pb-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-black font-headline leading-tight truncate" style={{ color: INK }}>
                {payload.display_name ?? "Member"}
              </p>
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black font-headline uppercase tracking-[0.13em] whitespace-nowrap"
                style={{ color: badge.color, backgroundColor: badge.bg, border: `1px solid ${badge.border}` }}
              >
                {badge.label}
              </span>
            </div>
            {payload.tagline && (
              <p className="text-[11.5px] font-bold font-headline truncate mt-0.5" style={{ color: CYAN }}>
                {payload.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
        <div className="pt-4 space-y-4">
          {/* YOU & X — or, on your own profile, the explainer. */}
          {isSelf ? (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{ backgroundColor: "rgba(8,145,178,0.05)", border: "1px dashed rgba(8,145,178,0.35)" }}
            >
              <p className="text-[10px] font-black font-headline uppercase tracking-[0.16em] mb-1" style={{ color: CYAN }}>
                You &amp; …
              </p>
              <p className="text-[12px] leading-snug" style={{ color: "#64748b" }}>
                When someone from your tribe opens your profile, this is where
                they see what you have done together: the experiences that
                connect you.
              </p>
            </div>
          ) : (
            shared &&
            shared.count > 0 && (
              <div
                className="rounded-xl px-3.5 py-3"
                style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: `inset 3px 0 0 ${CYAN}` }}
              >
                <p className="text-[10px] font-black font-headline uppercase tracking-[0.16em] mb-1" style={{ color: CYAN }}>
                  You &amp; {firstName}
                </p>
                {shared.active_titles.length > 0 && (
                  <p className="text-[12.5px] leading-snug" style={{ color: INK }}>
                    <span className="font-bold">Both active in:</span> {shared.active_titles.join(", ")}
                  </p>
                )}
                {shared.completed_titles.length > 0 && (
                  <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: INK }}>
                    <span className="font-bold">Completed together:</span> {shared.completed_titles.join(", ")}
                  </p>
                )}
              </div>
            )
          )}

          {payload.limited ? (
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              This member keeps their profile private.
            </p>
          ) : (
            <>
              {/* FACTS — structured chips: icon + text, bordered, cream. */}
              {factChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {factChips.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold font-headline px-2.5 py-1 rounded-full"
                      style={{ color: "#475569", backgroundColor: "#F7F5F0", border: "1px solid rgba(15,34,41,0.08)" }}
                    >
                      <span style={{ color: "#94a3b8" }}>{c.icon}</span>
                      {c.text}
                    </span>
                  ))}
                </div>
              )}
              {facts.focus && (
                <p className="text-[12px] leading-snug -mt-1" style={{ color: "#64748b" }}>
                  <span className="font-bold font-headline" style={{ color: ORANGE }}>Working on:</span>{" "}
                  {facts.focus}
                </p>
              )}

              {payload.bio && (
                <p className="text-[13px] leading-relaxed" style={{ color: "#475569" }}>
                  {payload.bio}
                </p>
              )}

              {/* BACKGROUND — expert credentials. */}
              {isExpert && (payload.credentials?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] mb-2" style={{ color: "#94a3b8" }}>
                    Background
                  </p>
                  <ul className="space-y-1.5">
                    {payload.credentials!.map((cr) => {
                      const meta = [cr.org, credentialPeriod(cr.year, cr.year_end)].filter(Boolean).join(" · ");
                      return (
                        <li key={cr.id} className="flex gap-2">
                          <span className="shrink-0 mt-[2px]" style={{ color: ORANGE }}>
                            <CredentialIcon kind={cr.kind} size={13} />
                          </span>
                          <span className="text-[12px] leading-snug">
                            <span className="font-bold font-headline" style={{ color: INK }}>{cr.title}</span>
                            {meta && <span style={{ color: "#94a3b8" }}> · {meta}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* PROOF — On INFITRA, in the designed card family. */}
              {proofCards.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] mb-2" style={{ color: "#94a3b8" }}>
                    On INFITRA
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {proofCards.map((c, i) => (
                      <StatCard key={i} icon={c.icon} value={c.value} label={c.label} accent={c.accent} sub={c.sub} onClick={c.onClick} compact />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Bits ────────────────────────────────────────────────────

function ModalAvatar({ src, name, expert, founding }: { src: string | null; name: string; expert: boolean; founding: boolean }) {
  const ring = founding ? GOLD : expert ? ORANGE : CYAN;
  const inner = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-full h-full rounded-full object-cover" />
  ) : (
    <span className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: `${ring}18` }}>
      <span className="text-2xl font-black font-headline" style={{ color: ring }}>
        {(name[0] ?? "?").toUpperCase()}
      </span>
    </span>
  );
  return (
    <div
      className="w-[72px] h-[72px] rounded-full shrink-0 p-[3px]"
      style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 2px ${ring}, 0 4px 14px rgba(15,34,41,0.15)` }}
    >
      {inner}
    </div>
  );
}

const PIN_ICON = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PERSON_ICON = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
const CAL_ICON = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 11h18" />
  </svg>
);
const BOLT_ICON = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8Z" />
  </svg>
);
