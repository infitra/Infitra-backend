"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";

/**
 * ProfileModal + ProfileTrigger — THE profile surface (social layer
 * foundation). Every display name and avatar in the product wraps in a
 * ProfileTrigger; clicking opens this modal. One artifact, one mental model
 * (it replaces the old in-feed popover).
 *
 * Data: one call to load_public_profile — base, facts, credentials, proof
 * numbers, and the "YOU & X" shared strip vs the viewer. Private profiles
 * come back `limited`: name, photo and the shared strip only, so a private
 * member is present in their tribe but nothing else is disclosed.
 *
 * Mount ONE <ProfileModalHost> per page region; triggers anywhere below it
 * open the shared modal via context, so the tree never holds N modals.
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

export function ProfileModalHost({ children }: { children: React.ReactNode }) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const open = useCallback((id: string) => {
    setPayload(null);
    setProfileId(id);
  }, []);
  const close = useCallback(() => setProfileId(null), []);

  useEffect(() => {
    if (!profileId) return;
    let alive = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("load_public_profile", {
        p_profile_id: profileId,
      });
      if (alive) setPayload(error ? { exists: false } : ((data ?? { exists: false }) as ProfilePayload));
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
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Profile"
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: "#FFFFFF",
                maxHeight: "min(82vh, 680px)",
                boxShadow: "0 24px 60px rgba(15,34,41,0.28)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalBody payload={payload} onClose={close} />
            </div>
          </div>,
          document.body,
        )}
    </ProfileModalCtx.Provider>
  );
}

function ModalBody({ payload, onClose }: { payload: ProfilePayload | null; onClose: () => void }) {
  if (!payload) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-xs" style={{ color: "#94a3b8" }}>Loading…</p>
      </div>
    );
  }
  if (!payload.exists) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-xs" style={{ color: "#94a3b8" }}>This profile is not available.</p>
      </div>
    );
  }

  const isExpert = payload.role === "creator";
  const facts = payload.facts ?? {};
  const factChips: string[] = [];
  if (facts.age) factChips.push(`${facts.age}`);
  if (facts.city) factChips.push(facts.city);
  if (facts.training_since) factChips.push(`Training since ${facts.training_since}`);
  for (const d of (facts.disciplines ?? []).slice(0, 4)) factChips.push(d);
  if (facts.focus) factChips.push(`Working on: ${facts.focus}`);

  const shared = payload.shared;
  const proof = payload.proof ?? {};
  const firstName = (payload.display_name ?? "them").split(" ")[0];

  const proofItems: Array<{ value: string; label: string }> = isExpert
    ? [
        ...((proof.total_reviews ?? 0) > 0
          ? [{ value: `★ ${Number(proof.avg_rating ?? 0).toFixed(1)}`, label: `${proof.total_reviews} reviews` }]
          : []),
        { value: `${proof.tribe_count ?? 0}`, label: "in their tribe" },
        { value: `${proof.hosting_count ?? 0}`, label: proof.hosting_count === 1 ? "experience" : "experiences" },
        { value: `${proof.sessions_led ?? 0}`, label: "sessions led" },
        { value: `${proof.questions_answered ?? 0}`, label: "questions answered" },
      ]
    : payload.limited || proof.tribes_count === undefined
      ? []
      : [
          { value: `${proof.tribes_count ?? 0}`, label: proof.tribes_count === 1 ? "tribe" : "tribes" },
          { value: `${proof.completed_count ?? 0}`, label: "completed" },
          { value: `${proof.sessions_attended ?? 0}`, label: "sessions attended" },
        ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(15,34,41,0.08)" }}>
        <ModalAvatar src={payload.avatar_url ?? null} name={payload.display_name ?? "?"} expert={isExpert} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-black font-headline truncate" style={{ color: INK }}>
            {payload.display_name ?? "Member"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black font-headline uppercase tracking-[0.14em]"
              style={
                isExpert
                  ? { color: "#c2410c", backgroundColor: "rgba(255,97,48,0.10)" }
                  : { color: CYAN, backgroundColor: "rgba(8,145,178,0.08)" }
              }
            >
              {isExpert ? "Expert" : "Tribe member"}
            </span>
            {payload.is_founding_expert && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black font-headline uppercase tracking-[0.12em]"
                style={{ color: "#92700c", backgroundColor: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.35)" }}
              >
                Founding Expert
              </span>
            )}
          </div>
          {payload.tagline && (
            <p className="text-[11px] font-bold font-headline truncate mt-0.5" style={{ color: CYAN }}>
              {payload.tagline}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(15,34,41,0.06)] shrink-0"
          aria-label="Close"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2.5} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto px-5 py-4 space-y-4">
        {/* YOU & X — the relational hook, always first when it exists. */}
        {shared && shared.count > 0 && (
          <div
            className="rounded-xl px-3.5 py-3"
            style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: `inset 3px 0 0 ${CYAN}` }}
          >
            <p className="text-[10px] font-black font-headline uppercase tracking-[0.16em] mb-1" style={{ color: CYAN }}>
              You &amp; {firstName}
            </p>
            {shared.active_titles.length > 0 && (
              <p className="text-[12.5px] leading-snug" style={{ color: INK }}>
                <span className="font-bold">Both active in:</span>{" "}
                {shared.active_titles.join(", ")}
              </p>
            )}
            {shared.completed_titles.length > 0 && (
              <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: INK }}>
                <span className="font-bold">Completed together:</span>{" "}
                {shared.completed_titles.join(", ")}
              </p>
            )}
          </div>
        )}

        {payload.limited ? (
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            This member keeps their profile private.
          </p>
        ) : (
          <>
            {factChips.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {factChips.map((c, i) => (
                  <span
                    key={i}
                    className="text-[10.5px] font-bold font-headline px-2 py-0.5 rounded-full"
                    style={{ color: "#475569", backgroundColor: "rgba(15,34,41,0.05)" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {payload.bio && (
              <p className="text-[13px] leading-relaxed" style={{ color: "#475569" }}>
                {payload.bio}
              </p>
            )}

            {isExpert && (payload.credentials?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] mb-1.5" style={{ color: "#94a3b8" }}>
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

            {proofItems.length > 0 && (
              <div>
                <p className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] mb-1.5" style={{ color: "#94a3b8" }}>
                  On INFITRA
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {proofItems.map((it, i) => (
                    <span key={i} className="text-[12px] font-bold font-headline whitespace-nowrap" style={{ color: "#475569" }}>
                      <span style={{ color: it.value.startsWith("★") ? GOLD : INK }} className="font-black">
                        {it.value}
                      </span>{" "}
                      {it.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ModalAvatar({ src, name, expert }: { src: string | null; name: string; expert: boolean }) {
  const ring = expert ? ORANGE : CYAN;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="w-14 h-14 rounded-full object-cover shrink-0"
        style={{ border: `2px solid ${ring}` }}
      />
    );
  }
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
      style={{ border: `2px solid ${ring}`, backgroundColor: `${ring}18` }}
    >
      <span className="text-xl font-black font-headline" style={{ color: ring }}>
        {(name[0] ?? "?").toUpperCase()}
      </span>
    </div>
  );
}
