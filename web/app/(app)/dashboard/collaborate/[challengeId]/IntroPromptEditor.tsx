"use client";

import { SectionAttribution } from "./SectionAttribution";
import type { ActivityRow } from "./useWorkspaceRealtime";

/**
 * The intro prompt — the question that fires for each new buyer the
 * first time they land in the cohort space (Bundle 8). Default
 * fallback ("What are you hoping to get from this program?") is used
 * when the field is empty; this is a custom version creators can
 * write to set a more program-shaped tone.
 *
 * Auto-save: parent owns value state, onCommit fires on blur.
 * SectionAttribution reads the workspace activity log.
 */

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  canEdit: boolean;
  activity: ActivityRow[];
  profileMap: Record<string, { name: string; avatar: string | null }>;
}

const DEFAULT_PLACEHOLDER = "What are you hoping to get from this program?";
const MAX_LENGTH = 500;
const INTRO_ATTRIBUTION_FIELDS = ["intro_prompt"];

export function IntroPromptEditor({
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
        {/* Polish v12: match the upgraded hierarchy from PromiseEditor.
            The Intro Prompt is the conversation starter for every new
            participant — it deserves a section heading, not a label. */}
        <h3
          className="text-xl font-black font-headline tracking-tight"
          style={{ color: "#0F2229" }}
        >
          Intro Prompt
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
        Fires for each new participant the first time they open the cohort
        space. Leave blank to use the default question.
      </p>

      {/* Polish v12: cool cyan tint on the field — Intro Prompt is the
          opening conversation (cyan = collaboration / cohost colour
          family), in contrast to the Promise's warm orange. */}
      {canEdit ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          maxLength={MAX_LENGTH + 50}
          placeholder={DEFAULT_PLACEHOLDER}
          className="w-full rounded-xl p-4 text-base font-bold focus:outline-none"
          style={{
            border: `1px solid ${overLimit ? "rgba(255,97,48,0.5)" : "rgba(8,145,178,0.20)"}`,
            backgroundColor: "rgba(156,240,255,0.06)",
            color: "#0F2229",
          }}
        />
      ) : value ? (
        <div
          className="rounded-xl p-5"
          style={{
            border: "1px solid rgba(8,145,178,0.20)",
            backgroundColor: "rgba(156,240,255,0.06)",
          }}
        >
          <p className="text-lg font-bold" style={{ color: "#0F2229" }}>
            {value}
          </p>
        </div>
      ) : (
        <p className="text-sm italic" style={{ color: "#94a3b8" }}>
          Default: &ldquo;{DEFAULT_PLACEHOLDER}&rdquo;
        </p>
      )}

      <SectionAttribution
        fields={INTRO_ATTRIBUTION_FIELDS}
        activity={activity}
        profiles={profileMap}
      />
    </div>
  );
}
