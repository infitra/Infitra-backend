"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { joinFoundingNetwork } from "@/app/actions/profile";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { CredentialsEditor, type EditableCredential } from "@/app/components/CredentialsEditor";

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

export interface JoinNetworkValues {
  id: string;
  displayName: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  city: string;
  disciplines: string[];
  entityType: "expert" | "studio" | null;
  brings: string;
  seeks: string;
  isFoundingExpert: boolean;
}

/**
 * The founding-network card, made in one go (8 Sep 2026, v3 after the
 * second test): the whole profile (photo, name, one line, city, a few lines,
 * background, disciplines) and the card (expert or studio, what you bring,
 * who you would want next to you) in one form with one button, and the card
 * itself rendered live next to the form as it takes shape.
 *
 * No visibility choice and no posts switch: showing the card on infitra.fit,
 * in the network and in INFITRA's posts is the deal, said in words at the
 * point of joining, withdrawable any time. The photo uploads first (edge
 * function) and the resulting URL is kept in state, so an error round trip
 * never loses it. One server action writes everything and lands on the
 * finished card.
 */
export function JoinNetworkForm({
  mode,
  initial,
}: {
  mode: "join" | "edit";
  initial: JoinNetworkValues;
}) {
  const [state, formAction, pending] = useActionState(joinFoundingNetwork, null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [name, setName] = useState(initial.displayName);
  const [tagline, setTagline] = useState(initial.tagline);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);
  const [disciplines, setDisciplines] = useState(initial.disciplines.join(", "));
  const [entity, setEntity] = useState<"expert" | "studio">(initial.entityType ?? "expert");
  const [brings, setBrings] = useState(initial.brings);
  const [seeks, setSeeks] = useState(initial.seeks);
  const [creds, setCreds] = useState<EditableCredential[]>([]);

  // The persisted photo URL (initial or freshly uploaded) and what to show.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.avatarUrl);
  const fileInput = useRef<HTMLInputElement>(null);
  const avatarFile = useRef<File | null>(null);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("The photo must be under 5MB.");
      return;
    }
    avatarFile.current = file;
    setAvatarPreview(URL.createObjectURL(file));
    setLocalError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    const fd = new FormData(e.currentTarget);
    let url = avatarUrl;
    if (avatarFile.current) {
      setUploading(true);
      const { uploadImage } = await import("@/lib/uploadImage");
      const up = await uploadImage(avatarFile.current, "avatar");
      setUploading(false);
      if (up.error || !up.url) {
        setLocalError(`Photo upload failed: ${up.error ?? "no URL returned"}`);
        return;
      }
      url = up.url;
      setAvatarUrl(url);
      avatarFile.current = null;
    }
    if (url) fd.set("avatar_url", url);
    startTransition(() => formAction(fd));
  }

  const busy = uploading || pending;
  const error = localError ?? (state && "error" in state ? state.error : null);
  const isStudio = entity === "studio";
  const disciplineList = disciplines
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, 8);

  const preview: FoundingMember = {
    id: initial.id,
    display_name: name.trim() || (isStudio ? "Your studio" : "Your name"),
    avatar_url: avatarPreview,
    tagline: tagline.trim() || null,
    bio: bio.trim() || null,
    username: null,
    entity_type: entity,
    is_founding_expert: initial.isFoundingExpert,
    brings: brings.trim() || null,
    seeks: seeks.trim() || null,
    facts: { city: city.trim() || null, disciplines: disciplineList, focus: null },
    credentials: creds.map((c) => ({
      kind: c.kind,
      title: c.title,
      org: c.org,
      year: c.year,
      year_end: c.year_end,
    })),
  };

  const field = {
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(15,34,41,0.15)",
    color: INK,
  } as const;
  const inputCls = "w-full px-4 py-3 rounded-xl focus:outline-none text-sm";
  const labelCls = "block text-xs font-bold uppercase tracking-wider mb-2 font-headline";
  const labelStyle = { color: "rgba(15,34,41,0.55)" } as const;
  const sectionCls = "rounded-3xl p-6 lg:p-8 flex flex-col gap-5";
  const sectionStyle = {
    backgroundColor: "rgba(255,255,255,0.62)",
    border: "1px solid rgba(15,34,41,0.08)",
  } as const;
  const counter = (n: number) => (
    <p className="text-[11px] mt-1 text-right" style={{ color: 200 - n < 20 ? ORANGE : "#94a3b8" }}>
      {200 - n}
    </p>
  );

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="entity_type" value={entity} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {/* ── Who you are ── */}
          <section className={sectionCls} style={sectionStyle}>
            <div>
              <h2 className="text-lg font-black font-headline tracking-tight mb-1" style={{ color: INK }}>
                Who you are
              </h2>
              <p className="text-xs" style={{ color: "#64748b" }}>
                The face of the card. Real photo, real name, the one line people remember you by.
              </p>
            </div>

            <div className="flex items-center gap-5">
              <button type="button" onClick={() => fileInput.current?.click()} className="shrink-0">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover"
                    style={{ border: "3px solid rgba(255,97,48,0.35)" }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,97,48,0.12)", border: "3px solid rgba(255,97,48,0.35)" }}
                  >
                    <span className="text-3xl font-black font-headline" style={{ color: ORANGE }}>
                      {(name.trim() || "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="px-4 py-2 rounded-full text-xs font-bold font-headline"
                  style={{ color: ORANGE, border: "1px solid rgba(255,97,48,0.4)", backgroundColor: "rgba(255,255,255,0.6)" }}
                >
                  {avatarPreview ? "Change photo" : "Upload photo"}
                </button>
                <p className="text-[11px] mt-2" style={{ color: "#94a3b8" }}>
                  Square works best. Max 5MB.
                </p>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onPickAvatar}
              />
            </div>

            <div>
              <label htmlFor="display_name" className={labelCls} style={labelStyle}>
                Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isStudio ? "Your studio's name" : "Your name"}
                className={inputCls}
                style={field}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
              <div>
                <label htmlFor="tagline" className={labelCls} style={labelStyle}>
                  One line about you
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  maxLength={120}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder={isStudio ? "e.g. Strength and mobility studio" : "e.g. Sports nutrition for endurance athletes"}
                  className={inputCls}
                  style={field}
                />
              </div>
              <div>
                <label htmlFor="city" className={labelCls} style={labelStyle}>
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  maxLength={60}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Zurich"
                  className={inputCls}
                  style={field}
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className={labelCls} style={labelStyle}>
                A few lines on your work
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                maxLength={2000}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  isStudio
                    ? "What the studio stands for, who trains there, what your members ask for."
                    : "Who you work with, what you are known for, how long you have done it."
                }
                className={`${inputCls} resize-none`}
                style={field}
              />
            </div>
          </section>

          {/* ── Your background ── */}
          <section className={sectionCls} style={sectionStyle}>
            <div>
              <h2 className="text-lg font-black font-headline tracking-tight mb-1" style={{ color: INK }}>
                Your background
              </h2>
              <p className="text-xs" style={{ color: "#64748b" }}>
                What makes you credible at a glance. It shows on your card and, later, on your
                experience pages.
              </p>
            </div>

            <CredentialsEditor
              intro="Certifications, education, experience. Each entry saves on its own."
              onChange={setCreds}
            />

            <div>
              <label htmlFor="disciplines" className={labelCls} style={labelStyle}>
                Disciplines
              </label>
              <input
                id="disciplines"
                name="disciplines"
                type="text"
                maxLength={200}
                value={disciplines}
                onChange={(e) => setDisciplines(e.target.value)}
                placeholder="Comma-separated, e.g. strength, mobility, sports nutrition"
                className={inputCls}
                style={field}
              />
            </div>
          </section>

          {/* ── Your card ── */}
          <section className={sectionCls} style={sectionStyle}>
            <div>
              <h2 className="text-lg font-black font-headline tracking-tight mb-1" style={{ color: INK }}>
                Your card
              </h2>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Two answers. This is what the network reads first, and what we match on.
              </p>
            </div>

            <div>
              <span className={labelCls} style={labelStyle}>
                You are
              </span>
              <div
                className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl"
                style={{ backgroundColor: "rgba(15,34,41,0.05)" }}
              >
                {(
                  [
                    { value: "expert", label: "An expert" },
                    { value: "studio", label: "A studio or gym" },
                  ] as const
                ).map((opt) => {
                  const on = entity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEntity(opt.value)}
                      aria-pressed={on}
                      className="py-3 rounded-xl text-sm font-headline font-bold transition-all"
                      style={{
                        backgroundColor: on ? ORANGE : "transparent",
                        color: on ? "#fff" : INK,
                        opacity: on ? 1 : 0.55,
                        boxShadow: on ? "0 4px 14px rgba(255,97,48,0.30)" : "none",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="brings" className={labelCls} style={labelStyle}>
                What you bring
              </label>
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Your craft, at full depth, and the people you already work with.
              </p>
              <textarea
                id="brings"
                name="brings"
                required
                rows={2}
                maxLength={200}
                value={brings}
                onChange={(e) => setBrings(e.target.value)}
                placeholder={
                  isStudio
                    ? "e.g. 400 members who ask for more than classes, a strength and a Pilates team"
                    : "e.g. sports nutrition for endurance athletes, a live group that has trained with me for six years"
                }
                className={`${inputCls} resize-none`}
                style={field}
              />
              {counter(brings.length)}
            </div>

            <div>
              <label htmlFor="seeks" className={labelCls} style={labelStyle}>
                Who you would want next to you
              </label>
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                A person or a place, as a picture: who would let you go all in on your part.
              </p>
              <textarea
                id="seeks"
                name="seeks"
                required
                rows={2}
                maxLength={200}
                value={seeks}
                onChange={(e) => setSeeks(e.target.value)}
                placeholder={
                  isStudio
                    ? "e.g. a sports nutritionist to take our members through six weeks, live"
                    : "e.g. a strength coach whose group trains together every week, or a studio whose members already ask for nutrition"
                }
                className={`${inputCls} resize-none`}
                style={field}
              />
              {counter(seeks.length)}
            </div>
          </section>

          {/* ── How we put you forward ── */}
          <section
            className={sectionCls}
            style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.18)" }}
          >
            <h2 className="text-lg font-black font-headline tracking-tight" style={{ color: INK }}>
              How we put you forward
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: INK }}>
              INFITRA is private and invite-only right now. Nobody finds you here by searching, so
              we are the ones who put you in front of the right people: your card shows on
              infitra.fit, to everyone in the network, and in our posts on LinkedIn and the like,
              always only what is on the card. We introduce you the moment a card fits yours.
              Nothing binding, nothing to run. Being seen is the whole point of joining early.
            </p>
          </section>

          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: "rgba(255,97,48,0.08)",
                border: "1px solid rgba(255,97,48,0.25)",
                color: ORANGE,
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 rounded-full font-black text-base hover:scale-[1.01] transition-transform font-headline disabled:opacity-50 text-white"
              style={{ backgroundColor: ORANGE, boxShadow: "0 6px 18px rgba(255,97,48,0.32)" }}
            >
              {uploading
                ? "Uploading photo…"
                : pending
                  ? "Saving…"
                  : mode === "join"
                    ? "Join the founding network"
                    : "Save your card"}
            </button>
            <p className="text-xs text-center" style={{ color: "#64748b" }}>
              {mode === "join"
                ? "Your card goes live the moment you join. Edit it any time."
                : "Changes show on infitra.fit and in the network right away."}
            </p>
            <p className="text-[11px] text-center" style={{ color: CYAN }}>
              Every card is shown with its owner&apos;s consent and can be withdrawn any time.
            </p>
          </div>
        </div>

        {/* ── The card, live ── */}
        <aside className="lg:sticky lg:top-24 min-w-0">
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
            style={{ color: CYAN }}
          >
            Your card, as it takes shape
          </p>
          <FoundingCard m={preview} />
          <p className="text-xs mt-3" style={{ color: "#64748b" }}>
            This is what the network and infitra.fit see. It updates as you type.
          </p>
        </aside>
      </div>
    </form>
  );
}
