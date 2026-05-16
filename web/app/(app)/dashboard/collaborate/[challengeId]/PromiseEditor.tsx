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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">
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
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#64748b" }}>
        One to three sentences. What this program will do for the participant —
        in your own voice, jointly written.
      </p>

      {canEdit ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          rows={3}
          maxLength={MAX_LENGTH + 50}
          placeholder="e.g. Strong Together — eight live sessions and two coaches walking you from base fitness to lasting habits over four weeks."
          className="w-full rounded-xl p-3 text-sm focus:outline-none resize-y"
          style={{
            border: `1px solid ${overLimit ? "rgba(255,97,48,0.5)" : "rgba(15,34,41,0.12)"}`,
            color: "#0F2229",
            minHeight: 90,
          }}
        />
      ) : value ? (
        <p className="text-base leading-relaxed" style={{ color: "#0F2229" }}>
          {value}
        </p>
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
