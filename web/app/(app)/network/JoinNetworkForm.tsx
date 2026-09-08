"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { joinFoundingNetwork } from "@/app/actions/profile";

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

export interface JoinNetworkValues {
  displayName: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  city: string;
  entityType: "expert" | "studio" | null;
  openTo: string[];
  brings: string;
  seeks: string;
  announceOk: boolean;
}

/**
 * The founding-network card, made in one go (8 Sep 2026): the profile
 * essentials and the card fields in one form with one button. The photo
 * uploads first (edge function), then one server action writes everything,
 * flips the card live and lands on the finished card.
 *
 * There is no visibility choice. The card shows on infitra.fit and to the
 * network, that is the deal, explained in words instead of offered as a
 * setting. Posts are the one switch, on by default, framed as the benefit
 * it is. In "edit" mode the same form saves an existing card.
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.avatarUrl);
  const [entity, setEntity] = useState<"expert" | "studio">(initial.entityType ?? "expert");
  const [brings, setBrings] = useState(initial.brings);
  const [seeks, setSeeks] = useState(initial.seeks);
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
    if (avatarFile.current) {
      setUploading(true);
      const { uploadImage } = await import("@/lib/uploadImage");
      const up = await uploadImage(avatarFile.current, "avatar");
      setUploading(false);
      if (up.error || !up.url) {
        setLocalError(`Photo upload failed: ${up.error ?? "no URL returned"}`);
        return;
      }
      fd.set("avatar_url", up.url);
      avatarFile.current = null;
    }
    startTransition(() => formAction(fd));
  }

  const busy = uploading || pending;
  const error = localError ?? (state && "error" in state ? state.error : null);
  const initial1 = (initial.displayName || "?")[0].toUpperCase();
  const isStudio = entity === "studio";

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

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="mode" value={mode} />

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

      {/* ── Who you are ── */}
      <section className={sectionCls} style={sectionStyle}>
        <div>
          <h2 className="text-lg font-black font-headline tracking-tight mb-1" style={{ color: INK }}>
            Who you are
          </h2>
          <p className="text-xs" style={{ color: "#64748b" }}>
            The face of the card: photo, name, one line, where you are, a few lines on your work.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileInput.current?.click()} className="shrink-0">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: "2px solid rgba(255,97,48,0.30)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,97,48,0.12)", border: "2px solid rgba(255,97,48,0.30)" }}
              >
                <span className="text-2xl font-black font-headline" style={{ color: ORANGE }}>
                  {initial1}
                </span>
              </div>
            )}
          </button>
          <div>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="text-xs font-bold font-headline"
              style={{ color: ORANGE }}
            >
              {avatarPreview ? "Change photo" : "Upload photo"}
            </button>
            <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
              A real photo of you, or your studio. Square, max 5MB.
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
            defaultValue={initial.displayName}
            placeholder="Your name or your studio's name"
            className={inputCls}
            style={field}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div>
            <label htmlFor="tagline" className={labelCls} style={labelStyle}>
              One line about you
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              maxLength={120}
              defaultValue={initial.tagline}
              placeholder={
                isStudio
                  ? "e.g. Strength and mobility studio, 400 members"
                  : "e.g. Sports nutrition for endurance athletes"
              }
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
              defaultValue={initial.city}
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
            defaultValue={initial.bio}
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

      {/* ── Your card ── */}
      <section className={sectionCls} style={sectionStyle}>
        <div>
          <h2 className="text-lg font-black font-headline tracking-tight mb-1" style={{ color: INK }}>
            Your card
          </h2>
          <p className="text-xs" style={{ color: "#64748b" }}>
            What the network reads first, and what we match on.
          </p>
        </div>

        <div>
          <span className={labelCls} style={labelStyle}>
            You are
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "expert", label: "An expert" },
                { value: "studio", label: "A studio or gym" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 cursor-pointer select-none"
                style={field}
              >
                <input
                  type="radio"
                  name="entity_type"
                  value={opt.value}
                  checked={entity === opt.value}
                  onChange={() => setEntity(opt.value)}
                  className="accent-[#FF6130]"
                />
                <span className="text-sm font-headline font-bold" style={{ color: INK }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className={labelCls} style={labelStyle}>
            Open to creating with
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "experts", label: "Experts" },
                { value: "studios", label: "Studios and gyms" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 cursor-pointer select-none"
                style={field}
              >
                <input
                  type="checkbox"
                  name="open_to"
                  value={opt.value}
                  defaultChecked={initial.openTo.includes(opt.value)}
                  className="accent-[#FF6130]"
                />
                <span className="text-sm font-headline font-bold" style={{ color: INK }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="brings" className={labelCls} style={labelStyle}>
            What you bring
          </label>
          <textarea
            id="brings"
            name="brings"
            rows={2}
            maxLength={200}
            value={brings}
            onChange={(e) => setBrings(e.target.value)}
            placeholder={
              isStudio
                ? "e.g. two rooms, a strength and a Pilates team, members who ask for more than classes"
                : "e.g. strength coaching for women over forty, a live group that has run for six years"
            }
            className={`${inputCls} resize-none`}
            style={field}
          />
          <p className="text-[11px] mt-1 text-right" style={{ color: 200 - brings.length < 20 ? ORANGE : "#94a3b8" }}>
            {200 - brings.length}
          </p>
        </div>

        <div>
          <label htmlFor="seeks" className={labelCls} style={labelStyle}>
            What would complement you
          </label>
          <textarea
            id="seeks"
            name="seeks"
            rows={2}
            maxLength={200}
            value={seeks}
            onChange={(e) => setSeeks(e.target.value)}
            placeholder={
              isStudio
                ? "e.g. a nutritionist or physio to build a six-week experience for our members"
                : "e.g. a nutritionist for the same audience, or a studio with a room full of members"
            }
            className={`${inputCls} resize-none`}
            style={field}
          />
          <p className="text-[11px] mt-1 text-right" style={{ color: 200 - seeks.length < 20 ? ORANGE : "#94a3b8" }}>
            {200 - seeks.length}
          </p>
        </div>
      </section>

      {/* ── How we put you forward ── */}
      <section
        className={sectionCls}
        style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.18)" }}
      >
        <div>
          <h2 className="text-lg font-black font-headline tracking-tight mb-2" style={{ color: INK }}>
            How we put you forward
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: INK }}>
            INFITRA is private and invite-only right now. Nobody finds you here by searching, so we
            are the ones who put you in front of the right people: your card shows on infitra.fit
            and to everyone in the network, and we introduce you the moment a card fits yours.
            Nothing binding, nothing to run. Being seen is the whole point of joining early.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="announce_ok"
            value="yes"
            defaultChecked={initial.announceOk}
            className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[#0891b2]"
          />
          <span className="text-sm leading-relaxed" style={{ color: INK }}>
            <span className="font-bold font-headline">INFITRA may feature my card in posts</span>, on
            LinkedIn and the like. This is how experts and studios outside the network find me. A
            post shows only what is on my card, nothing more, and I can switch it off any time.
          </span>
        </label>
      </section>

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
          Every card is shown with its owner&apos;s consent and can be withdrawn with one message.
        </p>
      </div>
    </form>
  );
}
