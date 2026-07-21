"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitPilotApplication } from "@/app/actions/pilot-application";

/**
 * Pilot application form — single page, conditional partner sections.
 * Uses `useActionState` so the server action can return either { error }
 * (re-render with error banner) or { success } (swap to confirmation
 * card). No redirect on success: the applicant might want to read the
 * confirmation before moving on.
 *
 * Visual language: cream card with rgba white background, orange CTA,
 * cyan accents — matches the landing + auth pages.
 */

const AUDIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "under_500", label: "Under 500" },
  { value: "500_to_2k", label: "500 – 2,000" },
  { value: "2k_to_10k", label: "2,000 – 10,000" },
  { value: "10k_to_50k", label: "10,000 – 50,000" },
  { value: "over_50k", label: "Over 50,000" },
];

export function PilotApplicationForm() {
  const [state, action, pending] = useActionState(submitPilotApplication, null);
  const [hasPartner, setHasPartner] = useState<"yes" | "no">("no");

  // Success state — replace the form entirely.
  if (state && "success" in state && state.success) {
    return <SuccessCard />;
  }

  return (
    <div
      className="rounded-3xl p-6 md:p-10"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 16px 48px rgba(15,34,41,0.06)",
      }}
    >
      {state && "error" in state && state.error && (
        <div
          className="mb-6 p-3 rounded-xl"
          style={{
            backgroundColor: "rgba(255,97,48,0.10)",
            border: "1px solid rgba(255,97,48,0.30)",
          }}
        >
          <p className="text-sm" style={{ color: "#FF6130" }}>
            {state.error}
          </p>
        </div>
      )}

      <form action={action} className="space-y-7">
        {/* ── Section: About you ──────────────────────────── */}
        <Section label="About you">
          <Field label="Your name" name="name" required>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={200}
              autoComplete="name"
              className={inputCls} style={FIELD_STYLE}
              placeholder="Lara Frey"
            />
          </Field>
          <Field label="Email" name="email" required>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              className={inputCls} style={FIELD_STYLE}
              placeholder="lara@example.com"
            />
          </Field>
          <Field label="Where you're based" name="location">
            <input
              id="location"
              name="location"
              type="text"
              maxLength={200}
              autoComplete="address-level2"
              className={inputCls} style={FIELD_STYLE}
              placeholder="Zurich, Switzerland"
            />
          </Field>
        </Section>

        {/* ── Section: Your work ──────────────────────────── */}
        <Section label="Your work">
          <Field label="Your area of expertise" name="expertise" required>
            <textarea
              id="expertise"
              name="expertise"
              required
              maxLength={500}
              rows={3}
              className={textareaCls} style={FIELD_STYLE}
              placeholder="e.g. strength training for women over 40, with a focus on mobility and injury prevention"
            />
          </Field>
          <Field
            label="Where people find you"
            name="channel_url"
            hint="Instagram, YouTube, TikTok, or your site — pick one."
          >
            <input
              id="channel_url"
              name="channel_url"
              type="url"
              maxLength={500}
              className={inputCls} style={FIELD_STYLE}
              placeholder="https://instagram.com/yourhandle"
            />
          </Field>
          <Field label="Audience size" name="audience_size_range">
            <select
              id="audience_size_range"
              name="audience_size_range"
              className={selectCls}
              style={FIELD_STYLE}
            >
              <option value="">Prefer not to say</option>
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        {/* ── Section: Your partner ───────────────────────── */}
        <Section label="Your partner">
          <fieldset className="space-y-3">
            <legend
              className="text-xs uppercase tracking-[0.18em] font-headline mb-2"
              style={{ color: "#475569", fontWeight: 700 }}
            >
              Do you already have an expert partner in mind?
            </legend>
            <div className="flex gap-3">
              <RadioPill
                name="has_partner"
                value="yes"
                checked={hasPartner === "yes"}
                onChange={() => setHasPartner("yes")}
                label="Yes"
              />
              <RadioPill
                name="has_partner"
                value="no"
                checked={hasPartner === "no"}
                onChange={() => setHasPartner("no")}
                label="Not yet"
              />
            </div>
          </fieldset>

          {hasPartner === "yes" ? (
            <Field
              label="Tell us about them"
              name="partner_info"
              hint="Their name, what they do, how complementary their expertise is."
            >
              <textarea
                id="partner_info"
                name="partner_info"
                maxLength={1000}
                rows={3}
                className={textareaCls} style={FIELD_STYLE}
                placeholder="e.g. Mia Aebi — registered nutritionist, focused on cycle-aware eating. We've talked about a joint experience for a while."
              />
            </Field>
          ) : (
            <Field
              label="What kind of partner would complement you?"
              name="complement_interest"
              hint="The expertise gap you'd want to fill."
            >
              <textarea
                id="complement_interest"
                name="complement_interest"
                maxLength={1000}
                rows={3}
                className={textareaCls} style={FIELD_STYLE}
                placeholder="e.g. a nutritionist or recovery specialist — I cover the training side but want someone to handle the food + sleep half."
              />
            </Field>
          )}
        </Section>

        {/* ── Section: Your ambition ──────────────────────── */}
        <Section label="Your ambition">
          <Field
            label="What would a successful pilot look like to you?"
            name="success_description"
            hint="One paragraph is plenty — we read every word."
          >
            <textarea
              id="success_description"
              name="success_description"
              maxLength={2000}
              rows={4}
              className={textareaCls} style={FIELD_STYLE}
              placeholder="e.g. 30 of my followers go through a four-week experience with a nutritionist, finish stronger and more confident, and want a second run."
            />
          </Field>
        </Section>

        {/* ── Submit ──────────────────────────────────────── */}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-4 rounded-full text-white text-base font-headline transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            backgroundColor: "#FF6130",
            fontWeight: 700,
            boxShadow:
              "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
          }}
        >
          {pending ? "Sending..." : "Send application"}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Local presentational helpers — kept inline because the form is
// the only place these styles apply.
// ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors";
const textareaCls = inputCls + " resize-y min-h-[90px]";
const selectCls = inputCls + " appearance-none";

const FIELD_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(15,34,41,0.15)",
  color: "#0F2229",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-[11px] uppercase tracking-[0.22em] font-headline mb-4 pb-2"
        style={{
          color: "#0F2229",
          fontWeight: 700,
          borderBottom: "1px solid rgba(8,145,178,0.20)",
        }}
      >
        {label}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  hint,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm mb-1.5 font-headline"
        style={{ color: "#0F2229", fontWeight: 600 }}
      >
        {label}
        {required && <span style={{ color: "#FF6130" }}> *</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-xs" style={{ color: "#94a3b8" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function RadioPill({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className="flex-1 cursor-pointer rounded-xl px-4 py-3 text-sm text-center transition-colors font-headline"
      style={{
        backgroundColor: checked ? "rgba(8,145,178,0.10)" : "rgba(255,255,255,0.78)",
        border: checked
          ? "1px solid rgba(8,145,178,0.50)"
          : "1px solid rgba(15,34,41,0.15)",
        color: checked ? "#0891b2" : "#0F2229",
        fontWeight: 600,
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────
// Success state — single confirmation card. No redirect.
// ─────────────────────────────────────────────────────────────────

function SuccessCard() {
  return (
    <div
      className="rounded-3xl p-8 md:p-12 text-center"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 16px 48px rgba(15,34,41,0.06)",
      }}
    >
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
        style={{
          backgroundColor: "rgba(8,145,178,0.12)",
          border: "1px solid rgba(8,145,178,0.30)",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0891b2"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2
        className="text-2xl md:text-3xl font-headline tracking-tight"
        style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        Application received.
      </h2>
      <p
        className="mt-4 text-base leading-relaxed max-w-md mx-auto"
        style={{ color: "#475569" }}
      >
        We read every application personally and reply within a week. If your work
        fits the pilot, we&apos;ll arrange a short call to talk through the partner fit
        and the experience shape.
      </p>
      <Link
        href="/"
        className="mt-7 inline-block px-6 py-3 rounded-full text-sm font-headline transition-transform hover:scale-[1.02]"
        style={{
          backgroundColor: "rgba(15,34,41,0.04)",
          border: "1px solid rgba(15,34,41,0.10)",
          color: "#0F2229",
          fontWeight: 600,
        }}
      >
        Back to the landing page
      </Link>
    </div>
  );
}
