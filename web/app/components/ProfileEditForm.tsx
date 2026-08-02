"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * ProfileEditForm — the expert's profile editor (dashboard panel), P7.
 *
 * Three zones, mirroring the profile's three layers:
 *   IDENTITY    — photo, display name, tagline, bio (as before).
 *   BACKGROUND  — structured credentials (certification / education /
 *                 experience · title · org · year). Self-declared, rendered
 *                 on the buyer page trust strip and the space popover.
 *   SHARE MORE  — optional human facts (age, city, training since,
 *                 disciplines, focus). Invitation tone: every field optional,
 *                 fill = share, empty = invisible everywhere.
 *
 * The cover image field is GONE (founder's walk: stored but never rendered
 * anywhere). The column stays for now; the UI stops feeding it.
 *
 * Mutation surface: Client + RLS (profile-class objects) — direct table
 * writes under the caller's own row policies, per the architecture table.
 */

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

export interface EditableCredential {
  id: string;
  kind: "certification" | "education" | "experience";
  title: string;
  org: string | null;
  year: number | null;
}

export interface ProfileFacts {
  age?: number;
  city?: string;
  training_since?: number;
  disciplines?: string[];
  focus?: string;
}

const KIND_META: Record<EditableCredential["kind"], { label: string; glyph: string }> = {
  certification: { label: "Certification", glyph: "📜" },
  education: { label: "Education", glyph: "🎓" },
  experience: { label: "Experience", glyph: "💼" },
};

export function ProfileEditForm({
  displayName,
  tagline,
  bio,
  avatarUrl,
  isCreator = true,
  initialFacts = {},
  initialCredentials = [],
  onSaved,
}: {
  displayName: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  isCreator?: boolean;
  initialFacts?: ProfileFacts;
  initialCredentials?: EditableCredential[];
  onSaved?: () => void;
}) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ── Credentials (creators): immediate CRUD, separate from Save. ──
  const [creds, setCreds] = useState<EditableCredential[]>(initialCredentials);
  const [credKind, setCredKind] = useState<EditableCredential["kind"]>("certification");
  const [credTitle, setCredTitle] = useState("");
  const [credOrg, setCredOrg] = useState("");
  const [credYear, setCredYear] = useState("");
  const [credBusy, setCredBusy] = useState(false);

  useEffect(() => setSuccess(false), [creds.length]);

  async function addCredential() {
    const title = credTitle.trim();
    if (title.length < 2) {
      setError("Give the credential a title (at least 2 characters).");
      return;
    }
    setCredBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const year = credYear.trim() ? parseInt(credYear.trim(), 10) : null;
      const { data, error: insErr } = await supabase
        .from("app_expert_credential")
        .insert({
          kind: credKind,
          title,
          org: credOrg.trim() || null,
          year: Number.isFinite(year as number) ? year : null,
        })
        .select("id, kind, title, org, year")
        .single();
      if (insErr) throw new Error(insErr.message);
      setCreds((prev) => [...prev, data as EditableCredential]);
      setCredTitle("");
      setCredOrg("");
      setCredYear("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the credential.");
    }
    setCredBusy(false);
  }

  async function removeCredential(id: string) {
    setCredBusy(true);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase.from("app_expert_credential").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      setCreds((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the credential.");
    }
    setCredBusy(false);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar must be under 5MB.");
        return;
      }
      avatarFileRef.current = file;
      setAvatarPreview(URL.createObjectURL(file));
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated.");
        setSaving(false);
        return;
      }

      const form = formRef.current;
      if (!form) {
        setError("Form not found.");
        setSaving(false);
        return;
      }
      const val = (name: string) =>
        (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() ?? "";

      const display_name = val("display_name");
      if (!display_name || display_name.length < 2) {
        setError("Display name must be at least 2 characters.");
        setSaving(false);
        return;
      }

      // Facts: fill = share. Only present keys are stored; clearing a field
      // removes the key, so the profile never renders empty rows.
      const facts: ProfileFacts = {};
      const age = parseInt(val("fact_age"), 10);
      if (Number.isFinite(age) && age >= 13 && age <= 120) facts.age = age;
      const city = val("fact_city");
      if (city) facts.city = city.slice(0, 60);
      const since = parseInt(val("fact_training_since"), 10);
      if (Number.isFinite(since) && since >= 1950 && since <= 2100) facts.training_since = since;
      const disciplines = val("fact_disciplines")
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (disciplines.length > 0) facts.disciplines = disciplines;
      const focus = val("fact_focus");
      if (focus) facts.focus = focus.slice(0, 120);

      const updates: Record<string, unknown> = {
        display_name,
        tagline: val("tagline") || null,
        bio: val("bio") || null,
        profile_facts: facts,
      };

      const { uploadImage } = await import("@/lib/uploadImage");
      if (avatarFileRef.current) {
        const up = await uploadImage(avatarFileRef.current, "avatar");
        if (up.error) {
          setError(`Avatar upload failed: ${up.error}`);
          setSaving(false);
          return;
        }
        if (up.url) updates.avatar_url = up.url;
      }

      const { error: updateError } = await supabase
        .from("app_profile")
        .update(updates)
        .eq("id", user.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess(true);
      onSaved?.();
      avatarFileRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setSaving(false);
  }

  const initials = (displayName || "?")[0].toUpperCase();
  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    border: "1px solid rgba(0, 0, 0, 0.10)",
  } as const;
  const labelClass =
    "block text-xs font-bold uppercase tracking-wider font-headline text-[#94a3b8] mb-2";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: "rgba(255, 97, 48, 0.08)", border: "1px solid rgba(255, 97, 48, 0.25)" }}
        >
          <p className="text-sm text-[#FF6130]">{error}</p>
        </div>
      )}
      {success && (
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}
        >
          <p className="text-sm text-emerald-700 font-bold font-headline">Profile updated!</p>
        </div>
      )}

      {/* Avatar */}
      <div>
        <label className={labelClass}>Profile Picture</label>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => avatarInputRef.current?.click()} className="relative group">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: "2px solid rgba(255, 97, 48, 0.30)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255, 97, 48, 0.12)", border: "2px solid rgba(255, 97, 48, 0.30)" }}
              >
                <span className="text-2xl font-black font-headline text-[#FF6130]">{initials}</span>
              </div>
            )}
          </button>
          <div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs font-bold font-headline text-[#FF6130]"
            >
              Upload photo
            </button>
            <p className="text-[10px] text-[#94a3b8] mt-0.5">Square image, max 5MB</p>
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="display_name" className={labelClass}>
          Display Name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          minLength={2}
          maxLength={50}
          defaultValue={displayName}
          className="w-full px-4 py-3 rounded-xl text-sm text-[#0F2229] focus:outline-none"
          style={inputStyle}
        />
      </div>

      {/* Tagline */}
      <div>
        <label htmlFor="tagline" className={labelClass}>
          Tagline
          <span className="font-normal normal-case tracking-normal ml-2 text-[#94a3b8]">one line about you</span>
        </label>
        <input
          id="tagline"
          name="tagline"
          type="text"
          maxLength={120}
          defaultValue={tagline}
          placeholder="e.g. HIIT specialist · Community builder"
          className="w-full px-4 py-3 rounded-xl text-sm text-[#0F2229] focus:outline-none"
          style={inputStyle}
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={2000}
          defaultValue={bio}
          placeholder="Tell people about yourself, your experience, and what you offer..."
          className="w-full px-4 py-3 rounded-xl text-sm text-[#0F2229] resize-none focus:outline-none"
          style={inputStyle}
        />
      </div>

      {/* ── BACKGROUND — the legitimacy layer (creators only) ── */}
      {isCreator && (
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,97,48,0.04)", border: "1px solid rgba(255,97,48,0.18)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider font-headline mb-1" style={{ color: "#c2410c" }}>
            Background
          </p>
          <p className="text-[11px] mb-3" style={{ color: "#64748b" }}>
            Certifications, education and experience. This is what shows buyers
            you are the right expert — it renders on your experience pages.
          </p>

          {creds.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {creds.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(15,34,41,0.08)" }}
                >
                  <span aria-hidden>{KIND_META[c.kind].glyph}</span>
                  <span className="font-bold font-headline truncate" style={{ color: INK }}>
                    {c.title}
                  </span>
                  {c.org && <span className="truncate" style={{ color: "#64748b" }}>· {c.org}</span>}
                  {c.year && <span style={{ color: "#94a3b8" }}>· {c.year}</span>}
                  <button
                    type="button"
                    onClick={() => removeCredential(c.id)}
                    disabled={credBusy}
                    className="ml-auto text-[10px] font-bold text-rose-500 hover:text-rose-700 shrink-0"
                    aria-label={`Remove ${c.title}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={credKind}
              onChange={(e) => setCredKind(e.target.value as EditableCredential["kind"])}
              className="h-9 rounded-lg px-2 text-xs col-span-1"
              style={inputStyle}
            >
              {(Object.keys(KIND_META) as Array<EditableCredential["kind"]>).map((k) => (
                <option key={k} value={k}>
                  {KIND_META[k].label}
                </option>
              ))}
            </select>
            <input
              value={credYear}
              onChange={(e) => setCredYear(e.target.value)}
              placeholder="Year (optional)"
              inputMode="numeric"
              maxLength={4}
              className="h-9 rounded-lg px-2.5 text-xs col-span-1"
              style={inputStyle}
            />
            <input
              value={credTitle}
              onChange={(e) => setCredTitle(e.target.value)}
              placeholder="Title, e.g. BSc Sport Science"
              maxLength={120}
              className="h-9 rounded-lg px-2.5 text-xs col-span-2"
              style={inputStyle}
            />
            <input
              value={credOrg}
              onChange={(e) => setCredOrg(e.target.value)}
              placeholder="Institution (optional)"
              maxLength={120}
              className="h-9 rounded-lg px-2.5 text-xs col-span-2"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={addCredential}
              disabled={credBusy || credTitle.trim().length < 2}
              className="col-span-2 h-9 rounded-full text-xs font-black font-headline text-white disabled:opacity-50"
              style={{ backgroundColor: ORANGE }}
            >
              {credBusy ? "Saving…" : "+ Add to your background"}
            </button>
          </div>
        </div>
      )}

      {/* ── SHARE MORE — optional facts, invitation tone ── */}
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(8,145,178,0.04)", border: "1px solid rgba(8,145,178,0.18)" }}
      >
        <p className="text-xs font-bold uppercase tracking-wider font-headline mb-1" style={{ color: CYAN }}>
          Share more with your tribe
        </p>
        <p className="text-[11px] mb-3" style={{ color: "#64748b" }}>
          All optional. Only what you fill in is shown — leave anything blank
          and it simply stays private.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="fact_age"
            defaultValue={initialFacts.age ?? ""}
            placeholder="Age"
            inputMode="numeric"
            maxLength={3}
            className="h-9 rounded-lg px-2.5 text-xs"
            style={inputStyle}
          />
          <input
            name="fact_city"
            defaultValue={initialFacts.city ?? ""}
            placeholder="City"
            maxLength={60}
            className="h-9 rounded-lg px-2.5 text-xs"
            style={inputStyle}
          />
          <input
            name="fact_training_since"
            defaultValue={initialFacts.training_since ?? ""}
            placeholder="Training since (year)"
            inputMode="numeric"
            maxLength={4}
            className="h-9 rounded-lg px-2.5 text-xs"
            style={inputStyle}
          />
          <input
            name="fact_disciplines"
            defaultValue={(initialFacts.disciplines ?? []).join(", ")}
            placeholder="Disciplines, comma-separated"
            maxLength={200}
            className="h-9 rounded-lg px-2.5 text-xs"
            style={inputStyle}
          />
          <input
            name="fact_focus"
            defaultValue={initialFacts.focus ?? ""}
            placeholder="Currently working on…"
            maxLength={120}
            className="h-9 rounded-lg px-2.5 text-xs col-span-2"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-50"
        style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
