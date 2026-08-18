"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFirstMoves } from "@/app/actions/profile";
import { uploadImage } from "@/lib/uploadImage";
import { ProfileTrigger } from "@/app/components/ProfileModal";
import { useOverlay, railActionStyle, OverlayPanel, OverlaySection } from "@/app/components/DashboardOverlay";
import { AccountSettingsPanel, PeoplePanel } from "@/app/components/AccountPanels";
import { STAT_ICONS } from "@/app/components/StatCards";
import type { ConnectionRow } from "@/app/components/ConnectionsGrid";
import { RateExperienceButton } from "./RateExperienceButton";

/**
 * ParticipantPanel — "My INFITRA", the participant's account console
 * (founder's coherence pass). The lean counterpart of the expert rail, same
 * card grammar, and the same overlay system: editing the profile and account
 * settings open as pop-ups inside the page, never as separate pages.
 *
 *   PROFILE       — avatar + greeting + pilot footing.
 *   MY JOURNEY    — Pioneer crown + designed stat cards (each with its own
 *                   accent and warmth, never a spreadsheet grid). The
 *                   connections card opens Your people. What you built here
 *                   is the glue that makes this account YOURS.
 *   QUICK ACTIONS — edit profile · view my profile · your people · settings.
 *   TO DO         — pending ratings.
 * The "Across your tribes" pulse is gone (legacy — the per-experience cards
 * carry those numbers).
 */

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";

export interface ParticipantFacts {
  age?: number;
  city?: string;
  training_since?: number;
  disciplines?: string[];
  focus?: string;
}

export interface Journey {
  experiences: number;
  completed: number;
  sessionsAttended: number;
  connections: number;
}

interface Props {
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  facts?: ParticipantFacts;
  viewerId: string;
  pendingReviews: { id: string; title: string }[];
  journey: Journey;
  visibility: string;
  connections: ConnectionRow[];
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function sinceMonth(joinedAt: string | null): string | null {
  if (!joinedAt) return null;
  const d = new Date(joinedAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

const EDIT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

function Section({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 ${className ?? ""}`} style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
      <p className="text-[11px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: "#94a3b8", fontWeight: 800 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * PioneerBadge — the participant's identity line: being a Pioneer is who
 * they are here, so it sits in the header where the generic pilot line used
 * to be. The joining month stays, quietly, underneath.
 */
function PioneerBadge({ joinedAt }: { joinedAt: string | null }) {
  const since = sinceMonth(joinedAt);
  return (
    <div className="mt-1">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: "rgba(255,97,48,0.10)",
          boxShadow: "inset 0 0 0 1px rgba(255,97,48,0.30)",
        }}
      >
        <span style={{ color: ORANGE }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
          </svg>
        </span>
        <span
          className="text-[10px] font-black font-headline uppercase tracking-[0.1em]"
          style={{ color: "#c2410c" }}
        >
          Pioneer
        </span>
      </span>
      {since && (
        <span className="text-[10px] ml-2" style={{ color: "#94a3b8" }} suppressHydrationWarning>
          since {since}
        </span>
      )}
    </div>
  );
}

export function ParticipantPanel({
  displayName,
  avatarUrl,
  joinedAt,
  pendingReviews,
  facts = {},
  viewerId,
  journey,
  visibility,
  connections,
}: Props) {
  const router = useRouter();
  const openOverlay = useOverlay();
  const fileRef = useRef<HTMLInputElement>(null);

  const [savedAvatar, setSavedAvatar] = useState<string | null>(avatarUrl);
  const [savedName, setSavedName] = useState(displayName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [name, setName] = useState(displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fAge, setFAge] = useState(facts.age ? String(facts.age) : "");
  const [fCity, setFCity] = useState(facts.city ?? "");
  const [fSince, setFSince] = useState(facts.training_since ? String(facts.training_since) : "");
  const [fDisc, setFDisc] = useState((facts.disciplines ?? []).join(", "));
  const [fFocus, setFFocus] = useState(facts.focus ?? "");
  const hasFacts =
    !!facts.age || !!facts.city || !!facts.training_since ||
    (facts.disciplines?.length ?? 0) > 0 || !!facts.focus;

  const firstName = (savedName || "there").split(" ")[0] || "there";
  const initial = (firstName[0] ?? "?").toUpperCase();
  const greeting = timeOfDayGreeting();

  const railBtn =
    "flex w-full items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-[13px] font-black font-headline transition-colors hover:bg-[rgba(15,34,41,0.03)]";

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }
    setError(null);
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      setError("Display name must be 2–50 characters.");
      return;
    }
    setBusy(true);
    setError(null);

    let newUrl: string | null = null;
    if (avatarFile) {
      const up = await uploadImage(avatarFile, "avatar");
      if (up.error) {
        setError(up.error);
        setBusy(false);
        return;
      }
      newUrl = up.url ?? null;
    }

    const fd = new FormData();
    fd.append("display_name", trimmed);
    if (newUrl) fd.append("avatar_url", newUrl);
    fd.append(
      "profile_facts",
      JSON.stringify({
        age: fAge.trim() ? Number(fAge.trim()) : undefined,
        city: fCity.trim() || undefined,
        training_since: fSince.trim() ? Number(fSince.trim()) : undefined,
        disciplines: fDisc
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        focus: fFocus.trim() || undefined,
      }),
    );
    const res = await saveFirstMoves(fd);
    if (res && "error" in res && res.error) {
      setError(res.error);
      setBusy(false);
      return;
    }

    if (newUrl) {
      setSavedAvatar(newUrl);
      setPreview(newUrl);
    }
    setSavedName(trimmed);
    setAvatarFile(null);
    setBusy(false);
    router.refresh();
  }

  const inputCls = "h-9 rounded-lg px-2.5 text-xs outline-none";
  const inputStyle: React.CSSProperties = { border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" };

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden h-full flex flex-col"
        style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 8px 26px rgba(15,34,41,0.08)" }}
      >
        {/* ── PROFILE ── */}
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,145,178,0.10), rgba(156,240,255,0.10) 70%, rgba(255,255,255,0))",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-full p-[2px]" style={{ background: "#9CF0FF" }}>
              {savedAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={savedAvatar} alt="" className="w-14 h-14 rounded-full object-cover block" style={{ border: "2px solid #FFFFFF" }} />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ border: "2px solid #FFFFFF", backgroundColor: "rgba(8,145,178,0.18)" }}
                >
                  <span className="text-xl font-headline" style={{ color: CYAN, fontWeight: 700 }}>
                    {initial}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-lg font-headline tracking-tight truncate"
                style={{ color: INK, fontWeight: 700, letterSpacing: "-0.015em" }}
                suppressHydrationWarning
              >
                {greeting}, {firstName}
              </p>
              <PioneerBadge joinedAt={joinedAt} />
            </div>
          </div>

          {/* The profile is where the numbers live now (same call as the
              expert console, 18 Aug): "My journey" duplicated the profile
              modal's own proof band, so the block carries ONE clear door
              into it instead. */}
          <ProfileTrigger profileId={viewerId} className="w-full mt-3">
            <span
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-[13px] font-black font-headline transition-transform hover:-translate-y-0.5"
              style={{
                color: CYAN,
                backgroundColor: "rgba(255,255,255,0.75)",
                boxShadow: `inset 0 0 0 1.5px ${CYAN}33`,
              }}
            >
              Show full profile
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </ProfileTrigger>

          {/* CONNECTIONS — the participant's accumulating value, the way
              earnings are the expert's: the people you have trained with and
              can find again. A card, and a door. */}
          <button
            type="button"
            onClick={() => openOverlay("people")}
            className="w-full mt-2 flex flex-col items-center rounded-xl px-4 py-2.5 transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "rgba(8,145,178,0.12)", boxShadow: `inset 0 0 0 1.5px ${CYAN}4D` }}
          >
            <span className="flex items-center gap-1.5">
              <span className="shrink-0" style={{ color: CYAN }}>{STAT_ICONS.people}</span>
              <span className="text-[20px] font-black font-headline leading-none tabular-nums" style={{ color: INK }}>
                {journey.connections}
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
            <span className="text-[10.5px] mt-1" style={{ color: "#64748b", fontWeight: 600 }}>
              people you have trained with
            </span>
          </button>
        </div>

        {/* ── NEEDS YOU ── same promise as the expert console: you cannot
            miss anything that waits on you. Always rendered and flex-1, so
            the console stands level with the experience card beside it even
            on a quiet day. */}
        <Section label="Needs you" className="flex-1 flex flex-col">
          {pendingReviews.length > 0 ? (
            <div className="space-y-2">
              {pendingReviews.map((r) => (
                <RateExperienceButton key={r.id} challengeId={r.id} experienceTitle={r.title} variant="console" />
              ))}
            </div>
          ) : !hasFacts ? (
            <button
              type="button"
              onClick={() => openOverlay("edit-profile")}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: "rgba(8,145,178,0.08)", boxShadow: `inset 3px 0 0 ${CYAN}` }}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold font-headline leading-tight" style={{ color: INK }}>
                  Add a little about yourself
                </span>
                <span className="block text-[10.5px] leading-tight mt-0.5" style={{ color: "#64748b" }}>
                  Your tribe sees who they are training with
                </span>
              </span>
              <span className="text-[11px] font-black shrink-0" style={{ color: CYAN }}>→</span>
            </button>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center mb-2.5"
                style={{ backgroundColor: "rgba(8,145,178,0.10)" }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <p className="text-[13px] font-black font-headline" style={{ color: INK }}>
                You&apos;re all caught up
              </p>
              <p className="text-[11px] mt-1 max-w-[215px]" style={{ color: "#94a3b8", fontWeight: 600 }}>
                Reflections and reviews land here when a session or an experience wraps.
              </p>
            </div>
          )}
        </Section>

        {/* ── QUICK ACTIONS ── half-width pairs, like the expert console.
            "View my profile" is gone: its door is the profile block above. */}
        <Section label="Quick actions">
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => openOverlay("edit-profile")} className={railBtn} style={railActionStyle}>
              {EDIT_ICON}
              Edit profile
            </button>
            <button type="button" onClick={() => openOverlay("settings")} className={railBtn} style={railActionStyle}>
              Settings
            </button>
          </div>
        </Section>

      </div>

      {/* ── OVERLAYS ── the same shell as the expert dashboard. */}
      <OverlayPanel id="edit-profile" title="Edit profile">
        <OverlaySection label="Photo & name">
          {error && <p className="text-xs mb-2" style={{ color: "#b91c1c" }}>{error}</p>}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-16 h-16 rounded-full overflow-hidden shrink-0"
              style={{ border: `2px solid ${CYAN}`, backgroundColor: preview ? "transparent" : "rgba(8,145,178,0.10)" }}
              aria-label="Change photo"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-headline flex items-center justify-center w-full h-full" style={{ color: CYAN, fontWeight: 700 }}>
                  {initial}
                </span>
              )}
              <span
                className="absolute inset-x-0 bottom-0 text-[8px] uppercase tracking-wider font-headline text-white text-center py-0.5"
                style={{ backgroundColor: "rgba(15,34,41,0.55)", fontWeight: 700 }}
              >
                Change
              </span>
            </button>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        </OverlaySection>

        <OverlaySection
          label="Share more with your tribe"
          intro="All optional. Only what you fill in is shown."
        >
          <div className="grid grid-cols-2 gap-2">
            <input value={fAge} onChange={(e) => setFAge(e.target.value)} placeholder="Age" inputMode="numeric" maxLength={3} className={inputCls} style={inputStyle} />
            <input value={fCity} onChange={(e) => setFCity(e.target.value)} placeholder="City" maxLength={60} className={inputCls} style={inputStyle} />
            <input value={fSince} onChange={(e) => setFSince(e.target.value)} placeholder="Training since" inputMode="numeric" maxLength={4} className={inputCls} style={inputStyle} />
            <input value={fDisc} onChange={(e) => setFDisc(e.target.value)} placeholder="Disciplines (comma-separated)" maxLength={200} className={inputCls} style={inputStyle} />
            <input value={fFocus} onChange={(e) => setFFocus(e.target.value)} placeholder="Currently working on…" maxLength={120} className={`${inputCls} col-span-2`} style={inputStyle} />
          </div>
        </OverlaySection>

        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-white text-[13px] font-black font-headline disabled:opacity-60"
            style={{ backgroundColor: ORANGE }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </OverlayPanel>

      <AccountSettingsPanel visibility={visibility} />
      <PeoplePanel connections={connections} isExpert={false} />
    </>
  );
}
