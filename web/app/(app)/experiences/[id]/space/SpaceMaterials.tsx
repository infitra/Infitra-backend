"use client";

import { createContext, useContext, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MaterialSheet, restoreSheetDraft, type MaterialRow } from "@/app/(app)/dashboard/collaborate/[challengeId]/SessionMaterials";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";

/**
 * SpaceMaterials — the tribe's side of experience materials (Phase 3).
 *
 * Materials render ONLY inside the session they belong to, in the week
 * journey: released ones as downloadable chips (orange = brought to the
 * session, cyan = came out of it), locked ones dimmed and dashed with their
 * unlock moment — the constellation's open-slot grammar: visible, and
 * unmistakably future. No Files tab, no library, ever.
 *
 * EXPERTS also manage materials from here, because the workspace editor is
 * the drafting room only: once an experience is published, the space IS the
 * expert's surface, and mid-flight sheets ("someone asked a great question,
 * here is a template") must be attachable in the room where they happened.
 * Same MaterialSheet as the workspace, one grammar.
 *
 * The sheet's state lives on the PROVIDER (above the journey), not on the
 * session cards — the space refetches its snapshot on realtime activity and
 * remounts the card subtrees, the same trap the workspace hit.
 *
 * Downloads: the client mints its own signed URL — storage RLS already
 * scopes reads to the tribe, and the load RPC only hands members a path
 * once the material is released.
 */

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";
const BUCKET = "experience-materials";

interface MaterialsCtx {
  materials: MaterialRow[];
  isCreator: boolean;
  openSheet: (sessionId: string, existing: MaterialRow | null) => void;
  remove: (m: MaterialRow) => Promise<void>;
}

const Ctx = createContext<MaterialsCtx>({
  materials: [],
  isCreator: false,
  openSheet: () => {},
  remove: async () => {},
});

export function SpaceMaterialsProvider({
  materials: initial,
  children,
}: {
  materials: MaterialRow[];
  children: React.ReactNode;
}) {
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const experience = useExperienceSpaceStore((s) => s.experience);
  const [materials, setMaterials] = useState<MaterialRow[]>(initial);
  const [sheet, setSheet] = useState<{ sessionId: string; existing: MaterialRow | null } | null>(
    () => restoreSheetDraft(experience.id),
  );

  async function refetch() {
    const supabase = createClient();
    const { data } = await supabase.rpc("load_challenge_materials", {
      p_challenge_id: experience.id,
    });
    if (Array.isArray(data)) setMaterials(data as MaterialRow[]);
  }

  async function remove(m: MaterialRow) {
    const supabase = createClient();
    const { error } = await supabase.from("app_challenge_material").delete().eq("id", m.id);
    if (error) return;
    if (m.storage_path) await supabase.storage.from(BUCKET).remove([m.storage_path]);
    await refetch();
  }

  return (
    <Ctx.Provider
      value={{
        materials,
        isCreator,
        openSheet: (sessionId, existing) => setSheet({ sessionId, existing }),
        remove,
      }}
    >
      {children}
      {sheet && (
        <MaterialSheet
          challengeId={experience.id}
          sessionId={sheet.sessionId}
          existing={sheet.existing}
          onClose={() => setSheet(null)}
          onSaved={() => {
            setSheet(null);
            refetch();
          }}
        />
      )}
    </Ctx.Provider>
  );
}

const FILE_GLYPH = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
  </svg>
);

const LOCK_GLYPH = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

function unlockLabel(m: MaterialRow): string {
  if (m.timing === "after") return "after the session";
  if (!m.released_at) return "before the session";
  const d = new Date(m.released_at);
  if (isNaN(d.getTime())) return "before the session";
  return `unlocks ${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`;
}

/**
 * The chips for one session. Members: released = downloadable, locked =
 * dimmed with the unlock moment. Experts: everything downloadable, plus
 * edit / remove / attach. Renders nothing for a bare session viewed by a
 * member — silence is the correct default.
 */
export function SessionMaterialChips({ sessionId }: { sessionId: string }) {
  const { materials, isCreator, openSheet, remove } = useContext(Ctx);
  const mats = materials.filter((m) => m.session_id === sessionId);
  if (mats.length === 0 && !isCreator) return null;

  async function download(e: React.MouseEvent, m: MaterialRow) {
    e.stopPropagation();
    if (!m.storage_path) return;
    const supabase = createClient();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(m.storage_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
      {mats.map((m) => {
        const accent = m.timing === "after" ? CYAN : ORANGE;
        const locked = !m.released || !m.storage_path;

        if (locked && !isCreator) {
          // LOCKED, member view — present, dimmed, dated. The open-slot grammar.
          return (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                border: "1.5px dashed rgba(15,34,41,0.18)",
                backgroundColor: "rgba(255,255,255,0.5)",
                opacity: 0.75,
              }}
              title={m.note ?? undefined}
            >
              <span style={{ color: "#94a3b8" }}>{LOCK_GLYPH}</span>
              <span className="text-[10.5px] font-bold font-headline" style={{ color: "#94a3b8" }}>
                {m.title}
              </span>
              <span className="text-[9px]" style={{ color: "#b6bfc9" }} suppressHydrationWarning>
                {unlockLabel(m)}
              </span>
            </span>
          );
        }

        return (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full"
            style={{
              backgroundColor: `${accent}0D`,
              border: locked ? `1px dashed ${accent}55` : `1px solid ${accent}33`,
              opacity: locked ? 0.85 : 1,
            }}
          >
            <button
              type="button"
              onClick={(e) => download(e, m)}
              className="inline-flex items-center gap-1.5 cursor-pointer"
              title={m.note ? m.note : m.file_name}
            >
              <span style={{ color: accent }}>{locked ? LOCK_GLYPH : FILE_GLYPH}</span>
              <span className="text-[10.5px] font-bold font-headline truncate max-w-[160px]" style={{ color: INK }}>
                {m.title}
              </span>
              {locked ? (
                <span className="text-[9px]" style={{ color: "#94a3b8" }} suppressHydrationWarning>
                  {unlockLabel(m)}
                </span>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M5 21h14" />
                </svg>
              )}
            </button>
            {isCreator && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openSheet(sessionId, m); }}
                  className="p-0.5 text-[#94a3b8] hover:text-[#0F2229]"
                  title="Edit"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(m); }}
                  className="p-0.5 text-[#94a3b8] hover:text-red-500"
                  title="Remove"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </span>
        );
      })}

      {isCreator && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openSheet(sessionId, null); }}
          className="text-[10.5px] font-bold font-headline cursor-pointer"
          style={{ color: ORANGE }}
        >
          + Attach material
        </button>
      )}
    </div>
  );
}
