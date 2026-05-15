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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">
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
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#64748b" }}>
        Fires for each new participant the first time they open the cohort
        space. Leave blank to use the default question.
      </p>

      {canEdit ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          maxLength={MAX_LENGTH + 50}
          placeholder={DEFAULT_PLACEHOLDER}
          className="w-full rounded-xl p-3 text-sm focus:outline-none"
          style={{
            border: `1px solid ${overLimit ? "rgba(255,97,48,0.5)" : "rgba(15,34,41,0.12)"}`,
            color: "#0F2229",
          }}
        />
      ) : value ? (
        <p className="text-base" style={{ color: "#0F2229" }}>
          {value}
        </p>
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
