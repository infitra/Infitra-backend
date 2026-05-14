"use client";

import { EditedAttribution } from "@/app/components/EditedAttribution";

/**
 * The intro prompt — the question that fires for each new buyer the
 * first time they land in the cohort space (Bundle 8). Default
 * fallback ("What are you hoping to get from this program?") is used
 * when the field is empty; this is a custom version creators can
 * write to set a more program-shaped tone.
 *
 * Saved as part of the larger handleSave action in WorkspaceEditor.
 */

interface Props {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  editedAt: string | null;
  editorName: string | null;
}

const DEFAULT_PLACEHOLDER = "What are you hoping to get from this program?";
const MAX_LENGTH = 500;

export function IntroPromptEditor({
  value,
  onChange,
  canEdit,
  editedAt,
  editorName,
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

      <EditedAttribution editedAt={editedAt} editorName={editorName} />
    </div>
  );
}
