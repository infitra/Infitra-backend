"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFirstMoves } from "@/app/actions/profile";
import { uploadImage } from "@/lib/uploadImage";
import { MetricStrip, type Metric } from "@/app/(app)/dashboard/MetricStrip";
import { RateExperienceButton } from "./RateExperienceButton";

/**
 * ParticipantPanel — the participant's "this is you" console, the lean
 * counterpart to the creator's ProfilePanel. Same card grammar (tinted header,
 * labelled sections, soft shadow). A member doesn't create or earn, so it holds
 * only: profile (with inline photo + name edit), and an "Across your tribes"
 * pulse of what's moving in the experiences they've joined.
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

interface Props {
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  tribePulse: { newPosts: number; experiences: number };
  hasActiveExperiences: boolean;
  /** Completed experiences the member hasn't rated yet — the console is the main
   *  action collector, so pending ratings surface here as a to-do. */
  facts?: ParticipantFacts;
  visibility?: string;
  pendingReviews: { id: string; title: string }[];
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function pilotLine(joinedAt: string | null): string {
  if (!joinedAt) return "On the pilot";
  const w = Math.floor((Date.now() - new Date(joinedAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (w <= 0) return "On the pilot · just joined";
  if (w === 1) return "On the pilot · 1 week in";
  return `On the pilot · ${w} weeks in`;
}

const EDIT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
      <p className="text-[11px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: "#94a3b8", fontWeight: 800 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export function ParticipantPanel({ displayName, avatarUrl, joinedAt, tribePulse, hasActiveExperiences, pendingReviews, facts = {}, visibility = "public" }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [savedAvatar, setSavedAvatar] = useState<string | null>(avatarUrl);
  const [savedName, setSavedName] = useState(displayName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [name, setName] = useState(displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optional facts (P7). Held as strings while editing so a cleared field is
  // simply an empty string — the action drops absent keys, so clearing one
  // makes it private again with no extra machinery.
  const [fAge, setFAge] = useState(facts.age ? String(facts.age) : "");
  const [fCity, setFCity] = useState(facts.city ?? "");
  const [fSince, setFSince] = useState(facts.training_since ? String(facts.training_since) : "");
  const [fDisc, setFDisc] = useState((facts.disciplines ?? []).join(", "));
  const [fFocus, setFFocus] = useState(facts.focus ?? "");
  const [isPublic, setIsPublic] = useState(visibility !== "private");
  const hasFacts =
    !!facts.age || !!facts.city || !!facts.training_since ||
    (facts.disciplines?.length ?? 0) > 0 || !!facts.focus;

  const firstName = (savedName || "there").split(" ")[0] || "there";
  const initial = (firstName[0] ?? "?").toUpperCase();
  const greeting = timeOfDayGreeting();

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

  function cancel() {
    setEditing(false);
    setError(null);
    setAvatarFile(null);
    setPreview(savedAvatar);
    setName(savedName);
    setFAge(facts.age ? String(facts.age) : "");
    setFCity(facts.city ?? "");
    setFSince(facts.training_since ? String(facts.training_since) : "");
    setFDisc((facts.disciplines ?? []).join(", "));
    setFFocus(facts.focus ?? "");
    setIsPublic(visibility !== "private");
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
    fd.append("visibility", isPublic ? "public" : "private");
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
    setEditing(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      className="rounded-2xl overflow-hidden h-full"
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
            {editing ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-14 h-14 rounded-full overflow-hidden block"
                style={{ border: "2px solid #FFFFFF", backgroundColor: preview ? "transparent" : "rgba(8,145,178,0.18)" }}
                aria-label="Change photo"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-headline" style={{ color: CYAN, fontWeight: 700 }}>
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
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-14 h-14 rounded-full object-cover block" style={{ border: "2px solid #FFFFFF" }} />
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
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
              />
            ) : (
              <>
                <p
                  className="text-lg font-headline tracking-tight truncate"
                  style={{ color: INK, fontWeight: 700, letterSpacing: "-0.015em" }}
                  suppressHydrationWarning
                >
                  {greeting}, {firstName}
                </p>
                <p
                  className="text-[11px] uppercase tracking-widest font-headline"
                  style={{ color: CYAN, fontWeight: 700 }}
                  suppressHydrationWarning
                >
                  {pilotLine(joinedAt)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />

      {/* ── QUICK ACTIONS ── */}
      <Section label="Quick actions">
        {!editing ? (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-[13px] font-black font-headline transition-colors"
              style={{ color: "#475569", border: "1px solid rgba(15,34,41,0.12)", backgroundColor: "rgba(255,255,255,0.6)" }}
            >
              {EDIT_ICON}
              Edit profile
            </button>
            {/* The entire engagement system for facts: one soft chip when the
                profile is bare. No progress bars, no completion percentage. */}
            {!hasFacts && (
              <button
                onClick={() => setEditing(true)}
                className="mt-2 w-full rounded-xl py-2 text-[11px] font-bold font-headline transition-colors"
                style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.07)" }}
              >
                Add a little about yourself →
              </button>
            )}
          </>
        ) : (
          <>
            {error && <p className="text-xs mb-2" style={{ color: "#b91c1c" }}>{error}</p>}

            {/* ── SHARE MORE — optional facts. Invitation, never a form to
                complete: everything blank stays private, and the copy says
                so plainly right here. ── */}
            <div
              className="rounded-xl p-3 mb-3"
              style={{ backgroundColor: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.16)" }}
            >
              <p className="text-[10px] uppercase tracking-widest font-headline mb-1" style={{ color: CYAN, fontWeight: 800 }}>
                Share more with your tribe
              </p>
              <p className="text-[11px] mb-2.5" style={{ color: "#64748b" }}>
                All optional. Only what you fill in is shown.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  value={fAge}
                  onChange={(e) => setFAge(e.target.value)}
                  placeholder="Age"
                  inputMode="numeric"
                  maxLength={3}
                  className="h-8 rounded-lg px-2 text-xs outline-none"
                  style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
                />
                <input
                  value={fCity}
                  onChange={(e) => setFCity(e.target.value)}
                  placeholder="City"
                  maxLength={60}
                  className="h-8 rounded-lg px-2 text-xs outline-none"
                  style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
                />
                <input
                  value={fSince}
                  onChange={(e) => setFSince(e.target.value)}
                  placeholder="Training since"
                  inputMode="numeric"
                  maxLength={4}
                  className="h-8 rounded-lg px-2 text-xs outline-none"
                  style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
                />
                <input
                  value={fDisc}
                  onChange={(e) => setFDisc(e.target.value)}
                  placeholder="Disciplines"
                  maxLength={200}
                  className="h-8 rounded-lg px-2 text-xs outline-none"
                  style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
                />
                <input
                  value={fFocus}
                  onChange={(e) => setFFocus(e.target.value)}
                  placeholder="Currently working on…"
                  maxLength={120}
                  className="h-8 rounded-lg px-2 text-xs outline-none col-span-2"
                  style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
                />
              </div>

              {/* The master switch. Private keeps name + photo (so nobody is a
                  ghost in their own tribe) and hides the rest. */}
              <label className="flex items-start gap-2 mt-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[11px] leading-snug" style={{ color: "#64748b" }}>
                  Show these details to your tribe.{" "}
                  <span style={{ color: "#94a3b8" }}>
                    Off keeps your name and photo visible and hides the rest.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={busy}
                className="flex-1 rounded-xl py-2.5 text-white text-[13px] font-black font-headline disabled:opacity-60"
                style={{ backgroundColor: ORANGE }}
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancel}
                disabled={busy}
                className="px-4 py-2.5 text-[13px] font-bold font-headline disabled:opacity-60"
                style={{ color: "#64748b" }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Section>

      {/* ── TO DO — the console collects pending actions (ratings for now) ── */}
      {pendingReviews.length > 0 && (
        <Section label="To do">
          <div className="space-y-2">
            {pendingReviews.map((r) => (
              <RateExperienceButton key={r.id} challengeId={r.id} experienceTitle={r.title} variant="console" />
            ))}
          </div>
        </Section>
      )}

      {/* ── ACROSS YOUR TRIBES ── */}
      {hasActiveExperiences && (
        <Section label="Across your tribes">
          {tribePulse.newPosts > 0 ? (
            <MetricStrip
              metrics={
                [
                  { value: tribePulse.newPosts, label: "new posts", accent: "cyan" },
                  {
                    value: tribePulse.experiences,
                    label: tribePulse.experiences === 1 ? "experience" : "experiences",
                  },
                ] as Metric[]
              }
            />
          ) : (
            <p className="text-[12px] font-bold font-headline" style={{ color: "#94a3b8" }}>
              All caught up — quiet for now
            </p>
          )}
        </Section>
      )}
    </div>
  );
}
