"use client";

import { SectionAttribution } from "./SectionAttribution";
import type { ActivityRow } from "./useWorkspaceRealtime";

/**
 * The Promise — 1–3 sentences capturing what the program will do for the
 * participant. Co-authored by both creators in the workspace; surfaces
 * verbatim on the public buyer page (Bundle 4) and as the first line of
 * the kickoff email (Bundle 10).
 *
 * Auto-save: parent owns the value state and `onCommit` callback fires
 * on blur. SectionAttribution chip below reads the workspace activity
 * log and shows the latest editor.
 */

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  canEdit: boolean;
  activity: ActivityRow[];
  profileMap: Record<string, { name: string; avatar: string | null }>;
}

const MAX_LENGTH = 600;
const PROMISE_ATTRIBUTION_FIELDS = ["promise_text"];

export function PromiseEditor({
  value,
  onChange,
  onCommit,
  canEdit,
  activity,
  profileMap,
}: Props) {
  const charCount = value.length;
  const overLimit = charCount > MAX_LENGTH;

  return (
    <div className="rounded-2xl infitra-card p-6">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        {/* Polish v12: section title is no longer muted micro-uppercase.
            The Promise IS the program's headline statement; treat the
            label like a section heading, not a form field affordance. */}
        <h3
          className="text-xl font-black font-headline tracking-tight"
          style={{ color: "#0F2229" }}
        >
          The Promise
        </h3>
        {canEdit && (
          <span
            className="text-[10px] font-bold font-headline uppercase tracking-wider"
            style={{ color: overLimit ? "#FF6130" : "#94a3b8" }}
          >
            {charCount}/{MAX_LENGTH}
          </span>
        )}
      </div>
      <p className="text-xs mb-5 leading-relaxed" style={{ color: "#64748b" }}>
        One to three sentences. What this program will do for the participant —
        in your own voice, jointly written.
      </p>

      {/* Polish v12: warm orange tint on the field itself so the
          Promise reads as a weighted statement, not a neutral form
          input. Larger type, more padding. Orange = the contract,
          mirroring the role colour for the owner / contract surface. */}
      {canEdit ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          rows={3}
          maxLength={MAX_LENGTH + 50}
          placeholder="e.g. Strong Together — eight live sessions and two coaches walking you from base fitness to lasting habits over four weeks."
          className="w-full rounded-xl p-4 text-base font-bold leading-relaxed focus:outline-none resize-y"
          style={{
            border: `1px solid ${overLimit ? "rgba(255,97,48,0.5)" : "rgba(255,97,48,0.20)"}`,
            backgroundColor: "rgba(255,97,48,0.04)",
            color: "#0F2229",
            minHeight: 110,
          }}
        />
      ) : value ? (
        <div
          className="rounded-xl p-5"
          style={{
            border: "1px solid rgba(255,97,48,0.20)",
            backgroundColor: "rgba(255,97,48,0.04)",
          }}
        >
          <p className="text-lg leading-relaxed font-bold" style={{ color: "#0F2229" }}>
            {value}
          </p>
        </div>
      ) : (
        <p className="text-sm italic" style={{ color: "#94a3b8" }}>
          No Promise written yet.
        </p>
      )}

      <SectionAttribution
        fields={PROMISE_ATTRIBUTION_FIELDS}
        activity={activity}
        profiles={profileMap}
      />
    </div>
  );
}
