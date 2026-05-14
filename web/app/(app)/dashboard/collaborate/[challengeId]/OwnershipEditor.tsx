"use client";

import { EditedAttribution } from "@/app/components/EditedAttribution";

/**
 * Who Handles What — per-creator topic ownership. Two columns shown
 * inline per row: sessions led (auto-derived from session.host_id —
 * read-only here) and topics owned (free-text comma-separated tags).
 *
 * Topics are a SOFT routing signal — they don't enforce anything.
 * Lara owning "training" doesn't lock Mia out of training cues; it
 * just communicates the default expectation to the cohort and the
 * Q&A composer in Bundle 9.
 *
 * Saved as part of the larger handleSave action in WorkspaceEditor.
 * Value shape: [{ creator_id: uuid, topics: ["training","strength"] }, ...].
 */

export interface TopicOwnershipEntry {
  creator_id: string;
  topics: string[];
}

interface CreatorRow {
  id: string;
  name: string;
  avatar: string | null;
  role: "owner" | "cohost";
  /** Sessions hosted by this creator (auto-derived; read-only). */
  sessionTitles: string[];
}

interface Props {
  creators: CreatorRow[];
  value: TopicOwnershipEntry[];
  onChange: (value: TopicOwnershipEntry[]) => void;
  canEdit: boolean;
  editedAt: string | null;
  editorName: string | null;
}

const MAX_TOPICS_PER_CREATOR = 6;
const MAX_TOPIC_LENGTH = 30;

function topicsToString(topics: string[]): string {
  return topics.join(", ");
}

function stringToTopics(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, MAX_TOPICS_PER_CREATOR)
    .map((t) => t.slice(0, MAX_TOPIC_LENGTH));
}

export function OwnershipEditor({
  creators,
  value,
  onChange,
  canEdit,
  editedAt,
  editorName,
}: Props) {
  function topicsFor(creatorId: string): string[] {
    return value.find((v) => v.creator_id === creatorId)?.topics ?? [];
  }

  function setTopicsFor(creatorId: string, topics: string[]) {
    const next = value.filter((v) => v.creator_id !== creatorId);
    if (topics.length > 0) {
      next.push({ creator_id: creatorId, topics });
    }
    onChange(next);
  }

  return (
    <div className="rounded-2xl infitra-card p-6">
      <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider mb-3">
        Who Handles What
      </h3>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#64748b" }}>
        Sessions are assigned automatically by who hosts them. Topics are a
        soft routing signal — comma-separated, your call.
      </p>

      <div className="space-y-3">
        {creators.map((creator) => {
          const topics = topicsFor(creator.id);
          return (
            <div
              key={creator.id}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{
                backgroundColor: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(15,34,41,0.06)",
              }}
            >
              {/* Creator identity column */}
              <div className="flex items-center gap-2.5 shrink-0" style={{ minWidth: 140 }}>
                {creator.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creator.avatar}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: creator.role === "owner"
                        ? "rgba(255,97,48,0.12)"
                        : "rgba(156,240,255,0.18)",
                    }}
                  >
                    <span
                      className="text-xs font-black font-headline"
                      style={{ color: creator.role === "owner" ? "#FF6130" : "#0891b2" }}
                    >
                      {creator.name?.[0] ?? "?"}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-sm font-bold font-headline truncate"
                    style={{ color: "#0F2229" }}
                  >
                    {creator.name}
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-wider font-bold font-headline"
                    style={{ color: creator.role === "owner" ? "#FF6130" : "#0891b2" }}
                  >
                    {creator.role}
                  </p>
                </div>
              </div>

              {/* Sessions led + Topics owned columns */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                {/* Sessions led — auto-derived */}
                <div>
                  <p
                    className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1.5"
                    style={{ color: "#94a3b8" }}
                  >
                    Sessions led
                  </p>
                  {creator.sessionTitles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {creator.sessionTitles.map((title, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: "rgba(15,34,41,0.05)",
                            color: "#475569",
                          }}
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] italic" style={{ color: "#94a3b8" }}>
                      No sessions yet
                    </p>
                  )}
                </div>

                {/* Topics owned — editable */}
                <div>
                  <p
                    className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1.5"
                    style={{ color: "#94a3b8" }}
                  >
                    Topics owned
                  </p>
                  {canEdit ? (
                    <input
                      type="text"
                      value={topicsToString(topics)}
                      onChange={(e) => setTopicsFor(creator.id, stringToTopics(e.target.value))}
                      placeholder="training, strength, recovery"
                      className="w-full rounded-lg p-2 text-xs font-bold font-headline focus:outline-none"
                      style={{
                        border: "1px solid rgba(15,34,41,0.10)",
                        color: "#0F2229",
                        backgroundColor: "white",
                      }}
                    />
                  ) : topics.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {topics.map((topic, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md font-bold font-headline"
                          style={{
                            backgroundColor: "rgba(8,145,178,0.08)",
                            color: "#0891b2",
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] italic" style={{ color: "#94a3b8" }}>
                      No topics yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <EditedAttribution editedAt={editedAt} editorName={editorName} />
    </div>
  );
}
