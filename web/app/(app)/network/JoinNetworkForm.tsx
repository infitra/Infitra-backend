"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import Link from "next/link";
import { joinFoundingNetwork } from "@/app/actions/profile";
import { FoundingCard, type FoundingMember } from "@/app/components/FoundingCard";
import { CredentialsEditor, type EditableCredential } from "@/app/components/CredentialsEditor";

/** The preview shows the link as the server will store it. */
function previewLink(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (/^@[\w.]+$/.test(v)) v = `https://instagram.com/${v.slice(1)}`;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    return new URL(v).toString();
  } catch {
    return null;
  }
}

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

export interface JoinNetworkValues {
  id: string;
  displayName: string;
  tagline: string;
  avatarUrl: string | null;
  city: string;
  linkUrl: string;
  entityType: "expert" | "studio" | null;
  brings: string;
  seeks: string;
  isFoundingExpert: boolean;
}

/**
 * The card editor (8 Sep 2026, rebuilt around the finished card). Four
 * numbered steps in the card's own order: who you are (expert or studio,
 * which sets the words on the card), the face of the card, the two answers,
 * the background. The card assembles live next to the form, exactly as the
 * network will see it. Each step ticks off as it is complete and the line
 * under the button names what is still missing. One button.
 *
 * No visibility choice and no posts switch: showing the card on infitra.fit,
 * in the network and once in a welcome post is the deal, said in words at
 * the point of joining. The photo uploads first (edge function) and the
 * resulting URL is kept in state, so an error round trip never loses it.
 * One server action writes everything and lands on the finished card.
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
  const [link, setLink] = useState(initial.linkUrl);
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
    if (creds.length === 0) {
      setLocalError(
        entity === "studio"
          ? "Please add at least one entry to your track record, team or recognition."
          : "Please add at least one entry to your background: an experience, education or a certification.",
      );
      return;
    }
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
  const preview: FoundingMember = {
    id: initial.id,
    display_name: name.trim() || (isStudio ? "Your studio" : "Your name"),
    avatar_url: avatarPreview,
    tagline: tagline.trim() || null,
    username: null,
    entity_type: entity,
    is_founding_expert: initial.isFoundingExpert,
    brings: brings.trim() || null,
    seeks: seeks.trim() || null,
    link_url: previewLink(link),
    facts: { city: city.trim() || null },
    credentials: creds.map((c) => ({
      kind: c.kind,
      title: c.title,
      org: c.org,
      year: c.year,
      year_end: c.year_end,
    })),
  };

  // What is still missing. The two answers and one background entry are
  // required (the server checks them too); the photo and the rest complete
  // the card. Named in the line under the button, where the decision is.
  const missing: string[] = [];
  if (!avatarPreview) missing.push("photo");
  if (name.trim().length < 2) missing.push(isStudio ? "studio name" : "name");
  if (!tagline.trim()) missing.push("one line");
  if (!city.trim()) missing.push("location");
  if (!brings.trim() && !seeks.trim()) missing.push("both answers");
  else if (!brings.trim()) missing.push(isStudio ? "what we bring" : "my expertise");
  else if (!seeks.trim()) missing.push(isStudio ? "what would complement our offer" : "what would complement my work");
  if (creds.length === 0) missing.push(isStudio ? "track record, team or recognition" : "your background");
  const faceDone = !!avatarPreview && name.trim().length >= 2 && tagline.trim().length > 0 && city.trim().length > 0;
  const answersDone = brings.trim().length > 0 && seeks.trim().length > 0;
  const backgroundDone = creds.length > 0;

  const field = {
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(15,34,41,0.15)",
    color: INK,
  } as const;
  const inputCls = "w-full px-4 py-3 rounded-xl focus:outline-none text-sm";
  const labelCls = "block text-xs font-bold uppercase tracking-wider mb-2 font-headline";
  const labelStyle = { color: "rgba(15,34,41,0.55)" } as const;
  const sectionCls = "rounded-3xl p-6 lg:p-7 flex flex-col gap-5";
  const sectionStyle = {
    backgroundColor: "rgba(255,255,255,0.62)",
    border: "1px solid rgba(15,34,41,0.08)",
  } as const;
  const counter = (n: number) => (
    <p className="text-[11px] mt-1 text-right" style={{ color: 200 - n < 20 ? ORANGE : "#94a3b8" }}>
      {200 - n}
    </p>
  );
  // The numbered disc ticks off in cyan once the step is complete.
  const Step = ({ n, title, lead, done }: { n: number; title: string; lead: string; done?: boolean }) => (
    <div className="flex items-start gap-3">
      <span
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black font-headline mt-0.5"
        style={{ backgroundColor: done ? CYAN : ORANGE, color: "#fff" }}
        aria-label={done ? `Step ${n}, complete` : `Step ${n}`}
      >
        {done ? "✓" : n}
      </span>
      <div>
        <h2 className="text-lg font-black font-headline tracking-tight" style={{ color: INK }}>
          {title}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
          {lead}
        </p>
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="entity_type" value={entity} />

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {/* ── 1 · You are ── */}
          <section className={sectionCls} style={sectionStyle}>
            <Step
              n={1}
              title="You are"
              lead="This sets the words on your card: an expert's card says “My expertise”, a studio's says “What we bring”."
            />
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
                      backgroundColor: on ? (opt.value === "studio" ? CYAN : ORANGE) : "transparent",
                      color: on ? "#fff" : INK,
                      opacity: on ? 1 : 0.55,
                      boxShadow: on ? `0 4px 14px ${opt.value === "studio" ? "rgba(8,145,178,0.30)" : "rgba(255,97,48,0.30)"}` : "none",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 2 · The face of the card ── */}
          <section className={sectionCls} style={sectionStyle}>
            <Step
              n={2}
              done={faceDone}
              title="The face of the card"
              lead={
                isStudio
                  ? "The photo you already use, the studio's face or your space. The name, one line, where you are."
                  : "The photo you already use. Your name, the one line people remember you by, where you are."
              }
            />

            <div className="flex items-center gap-5">
              <button type="button" onClick={() => fileInput.current?.click()} className="shrink-0">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover"
                    style={{ border: "3px solid #FFFFFF", boxShadow: "0 6px 18px rgba(15,34,41,0.14)" }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "3px solid #FFFFFF", boxShadow: "0 6px 18px rgba(15,34,41,0.10)" }}
                  >
                    <span className="text-3xl font-black font-headline" style={{ color: CYAN }}>
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
                {isStudio ? "Studio name" : "Name"}
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
                placeholder={isStudio ? "e.g. Studio Kraftwerk" : "e.g. Anna Keller"}
                className={inputCls}
                style={field}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
              <div>
                <label htmlFor="tagline" className={labelCls} style={labelStyle}>
                  One line about {isStudio ? "the studio" : "you"}
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  maxLength={120}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder={isStudio ? "e.g. CrossFit gym, commercial gym with PT, Pilates studio" : "e.g. Sports nutrition for endurance athletes"}
                  className={inputCls}
                  style={field}
                />
              </div>
              <div>
                <label htmlFor="city" className={labelCls} style={labelStyle}>
                  Location(s)
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
              <label htmlFor="link_url" className={labelCls} style={labelStyle}>
                Where to find {isStudio ? "the studio" : "you"} <span className="normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <input
                id="link_url"
                name="link_url"
                type="text"
                maxLength={200}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Your website or social media link"
                className={inputCls}
                style={field}
              />
              <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>
                Shown inside the network only, never on the public pages.
              </p>
            </div>
          </section>

          {/* ── 3 · Your two answers ── */}
          <section className={sectionCls} style={sectionStyle}>
            <Step
              n={3}
              done={answersDone}
              title="Your two answers"
              lead="They sit at the heart of your card, and they are what we match on."
            />

            <div>
              <label htmlFor="brings" className={labelCls} style={labelStyle}>
                {isStudio ? "What we bring" : "My expertise"}
              </label>
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                {isStudio
                  ? "The studio at full depth: members, team, what people come for."
                  : "Your craft, at full depth, and who you already work with."}
              </p>
              <textarea
                id="brings"
                name="brings"
                required
                rows={3}
                maxLength={200}
                value={brings}
                onChange={(e) => setBrings(e.target.value)}
                placeholder={
                  isStudio
                    ? "e.g. 400 members who ask for more than classes, a strength and Pilates team, 5 active weekly group classes, 3000 newsletter subscribers, 8000 followers on socials"
                    : "e.g. sports nutrition for endurance athletes, a live group that has trained with me for six years, 4000 followers on Instagram, a newsletter with 1200 subscribers"
                }
                className={`${inputCls} resize-none`}
                style={field}
              />
              {counter(brings.length)}
            </div>

            <div>
              <label htmlFor="seeks" className={labelCls} style={labelStyle}>
                {isStudio ? "What would complement our offer" : "What would complement my work"}
              </label>
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Who would let you go all in on your part and complement you?
              </p>
              <textarea
                id="seeks"
                name="seeks"
                required
                rows={3}
                maxLength={200}
                value={seeks}
                onChange={(e) => setSeeks(e.target.value)}
                placeholder={
                  isStudio
                    ? "e.g. access to experts as an add-on for our members, another studio or expert to build up our digital offer beyond our location"
                    : "e.g. a complementary expert (strength, nutrition, sleep, recovery, mobility etc.), a fitness influencer with reach and distribution, a studio or gym looking to extend their offer to their members and audience"
                }
                className={`${inputCls} resize-none`}
                style={field}
              />
              {counter(seeks.length)}
            </div>
          </section>

          {/* ── 4 · Your background ── */}
          <section className={sectionCls} style={sectionStyle}>
            <Step
              n={4}
              done={backgroundDone}
              title={isStudio ? "Track record, team, recognition" : "Your background"}
              lead={
                isStudio
                  ? "What makes the studio credible at a glance. It shows at the foot of your card. At least one entry."
                  : "What makes you credible at a glance. It shows at the foot of your card and, later, on your experience pages. At least one entry."
              }
            />
            <CredentialsEditor
              intro={
                isStudio
                  ? "How long you have run, how many people train with you, who is on the team, what you are licensed or known for. Each entry saves on its own."
                  : "Experience, education, certifications. Each entry saves on its own."
              }
              onChange={setCreds}
              entity={entity}
            />
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
              INFITRA is private and invite-only right now, so we are the ones who put you in front
              of the right people. Your card shows on infitra.fit, to everyone in the network, and
              on our social channels, in the post that welcomes you to the founding network.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: INK }}>
              Only what you put on your card is shown, nothing else. Your email and everything you
              have not put on the card stay private, as set out in our{" "}
              <Link href="/privacy" className="underline" style={{ color: CYAN }}>
                privacy policy
              </Link>
              . We introduce you the moment a card fits yours. Nothing binding, nothing to run.
              Being seen is the whole point of joining early.
            </p>
            <p className="text-sm leading-relaxed font-bold font-headline" style={{ color: INK }}>
              You join as a founding member. The badge stays on your card when INFITRA opens
              publicly, founding cards hold the top spot in discovery, and your audience stays
              yours.
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
              {missing.length > 0
                ? `Still to fill in: ${missing.join(", ")}.`
                : mode === "join"
                  ? "Your card is complete. It goes live the moment you join, and you can edit it any time."
                  : "Changes show on infitra.fit and in the network right away."}
            </p>
            <p className="text-[11px] text-center" style={{ color: CYAN }}>
              Every card is shown with its owner&apos;s consent and can be withdrawn any time.
            </p>
          </div>
        </div>

        {/* ── The card, live ── */}
        <aside className="lg:sticky lg:top-24 min-w-0">
          <FoundingCard m={preview} />

          <p className="text-xs mt-4 text-center" style={{ color: "#64748b" }}>
            This is what the network and infitra.fit see. It updates as you type.
          </p>
        </aside>
      </div>
    </form>
  );
}
