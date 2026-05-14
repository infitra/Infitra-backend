/**
 * Inline attribution chip — `Edited 2h ago by Lara` — used under
 * editable workspace fields (Promise, Weekly Arc, Topic Ownership,
 * Intro Prompt) so co-designing creators see who last touched each
 * section without it spamming the chat thread.
 *
 * Pure presentational. Rendered inside server or client components.
 * If `editedAt` is null/undefined the chip renders nothing (the field
 * has never been edited beyond its default).
 */

interface Props {
  editedAt: string | null | undefined;
  editorName: string | null | undefined;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  // Past a week, show the date for clarity
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function EditedAttribution({ editedAt, editorName }: Props) {
  if (!editedAt || !editorName) return null;
  return (
    <p
      className="text-[11px] mt-1.5 italic"
      style={{ color: "#94a3b8" }}
    >
      Edited {timeAgo(editedAt)} by{" "}
      <span className="not-italic" style={{ color: "#64748b", fontWeight: 600 }}>
        {editorName}
      </span>
    </p>
  );
}
