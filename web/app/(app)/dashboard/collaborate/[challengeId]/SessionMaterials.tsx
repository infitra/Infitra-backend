"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

/**
 * SessionMaterials — the materials strip on a workspace session card
 * (Experience materials, Phase 2).
 *
 * The locked model, taught by the UI itself: materials attach to live
 * sessions, nothing else. One choice per file — released BEFORE the session
 * (24 h or 1 week ahead, for things people bring or prepare) or AFTER it
 * ends (the recap, the template you talked through). Release rides the
 * session's clock, so moving the session moves every attached material
 * with it, automatically.
 *
 * Mutation surface: Client + RLS. Upload goes storage-first (an orphaned
 * file is invisible and sweepable; an orphaned row would render a broken
 * chip), then the metadata row. Files live at
 * {challengeId}/{materialId}/{filename} in the private bucket.
 */

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";
const BUCKET = "experience-materials";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "Image",
  "image/png": "Image",
  "image/webp": "Image",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
};

export interface MaterialRow {
  id: string;
  session_id: string;
  session_title?: string;
  timing: "before_24h" | "before_1w" | "after";
  title: string;
  note: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  released: boolean;
  released_at: string | null;
  storage_path: string | null;
}

const TIMING_META: Record<MaterialRow["timing"], { chip: string; accent: string }> = {
  before_1w: { chip: "1 week before", accent: ORANGE },
  before_24h: { chip: "24 h before", accent: ORANGE },
  after: { chip: "after the session", accent: CYAN },
};

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80);
}

/**
 * The sheet's working draft lives OUTSIDE React. Both rooms (workspace and
 * space) have realtime machinery that can remount arbitrary subtrees, and
 * hoisting the modal state helped but did not fully kill the vanish (the
 * founder lost a selected PDF twice). A module singleton survives ANY
 * unmount, whatever its cause: the opener rehydrates the open state via
 * restoreSheetDraft(), and the sheet rehydrates its fields. Cleared on
 * save, or when the user closes it on purpose.
 */
interface SheetDraft {
  challengeId: string;
  sessionId: string;
  existing: MaterialRow | null;
  file: File | null;
  title: string;
  note: string;
  timing: MaterialRow["timing"];
}
let sheetDraft: SheetDraft | null = null;

/** Called by the openers' lazy state init: if a draft is alive for this
 *  experience, the sheet should be open. */
export function restoreSheetDraft(
  challengeId: string,
): { sessionId: string; existing: MaterialRow | null } | null {
  if (sheetDraft && sheetDraft.challengeId === challengeId) {
    return { sessionId: sheetDraft.sessionId, existing: sheetDraft.existing };
  }
  return null;
}

export function clearSheetDraft() {
  sheetDraft = null;
}

const FILE_GLYPH = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
  </svg>
);

export function SessionMaterials({
  materials,
  onOpenSheet,
  onChanged,
}: {
  materials: MaterialRow[];
  /** Opens the TOP-LEVEL sheet (state must live above the session cards:
   *  the realtime refetch remounts them and would kill a local modal). */
  onOpenSheet: (existing: MaterialRow | null) => void;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function download(m: MaterialRow) {
    if (!m.storage_path) return;
    const supabase = createClient();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(m.storage_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function remove(m: MaterialRow) {
    setError(null);
    const supabase = createClient();
    const { error: delErr } = await supabase.from("app_challenge_material").delete().eq("id", m.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    if (m.storage_path) await supabase.storage.from(BUCKET).remove([m.storage_path]);
    onChanged();
  }

  return (
    <div
      className="mt-3 pt-3"
      style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center flex-wrap gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.16em] font-headline mr-0.5" style={{ color: "#94a3b8", fontWeight: 800 }}>
          Materials
        </span>

        {materials.map((m) => {
          const meta = TIMING_META[m.timing];
          return (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full max-w-full"
              style={{ backgroundColor: `${meta.accent}0D`, border: `1px solid ${meta.accent}30` }}
            >
              <button
                type="button"
                onClick={() => download(m)}
                className="inline-flex items-center gap-1.5 min-w-0 cursor-pointer"
                title={`${m.file_name} · ${fmtSize(m.file_size_bytes)}`}
              >
                <span style={{ color: meta.accent }}>{FILE_GLYPH}</span>
                <span className="text-[11px] font-bold font-headline truncate max-w-[150px]" style={{ color: INK }}>
                  {m.title}
                </span>
                <span className="text-[9px] whitespace-nowrap" style={{ color: meta.accent, fontWeight: 700 }}>
                  {meta.chip}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSheet(m)}
                className="p-0.5 text-[#94a3b8] hover:text-[#0F2229]"
                title="Edit"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => remove(m)}
                className="p-0.5 text-[#94a3b8] hover:text-red-500"
                title="Remove"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => onOpenSheet(null)}
          className="text-[11px] font-bold font-headline cursor-pointer"
          style={{ color: ORANGE }}
        >
          + Attach material
        </button>
      </div>
      {error && <p className="text-[10px] mt-1" style={{ color: "#dc2626" }}>{error}</p>}
    </div>
  );
}

// ─── The attach / edit sheet ─────────────────────────────────

export function MaterialSheet({
  challengeId,
  sessionId,
  existing,
  onClose,
  onSaved,
}: {
  challengeId: string;
  sessionId: string;
  existing: MaterialRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fileRef = useRef<HTMLInputElement>(null);
  // Hydrate from the module draft when it matches this sheet (a remount mid
  // work), otherwise start fresh and claim the draft slot.
  const matching =
    sheetDraft &&
    sheetDraft.challengeId === challengeId &&
    sheetDraft.sessionId === sessionId &&
    (sheetDraft.existing?.id ?? null) === (existing?.id ?? null)
      ? sheetDraft
      : null;
  const [file, setFile] = useState<File | null>(matching?.file ?? null);
  const [title, setTitle] = useState(matching?.title ?? existing?.title ?? "");
  const [note, setNote] = useState(matching?.note ?? existing?.note ?? "");
  const [timing, setTiming] = useState<MaterialRow["timing"]>(matching?.timing ?? existing?.timing ?? "after");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Write-through: every field change lands in the module draft, so the
  // next mount (if a remount strikes) restores exactly this state.
  useEffect(() => {
    sheetDraft = { challengeId, sessionId, existing, file, title, note, timing };
  }, [challengeId, sessionId, existing, file, title, note, timing]);

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    if (!ALLOWED_MIME[f.type]) {
      setError("PDF, images, Word or Excel only.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Files can be up to 20 MB.");
      return;
    }
    setError(null);
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
  }

  async function save() {
    const t = title.trim();
    if (t.length < 2) {
      setError("Give the material a title.");
      return;
    }
    if (!existing && !file) {
      setError("Choose a file to attach.");
      return;
    }
    setBusy(true);
    setError(null);
    // Clear the draft NOW: if a remount strikes mid-upload the sheet must
    // not reopen and invite a duplicate submit.
    clearSheetDraft();
    const supabase = createClient();

    try {
      if (existing) {
        const { error: upErr } = await supabase
          .from("app_challenge_material")
          .update({ title: t, note: note.trim() || null, timing })
          .eq("id", existing.id);
        if (upErr) throw new Error(upErr.message);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated.");
        const id = crypto.randomUUID();
        const path = `${challengeId}/${id}/${sanitizeFileName(file!.name)}`;
        // Storage first: an orphaned file is invisible and sweepable; an
        // orphaned row would render a broken chip.
        const { error: storErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file!, { contentType: file!.type });
        if (storErr) throw new Error(storErr.message);
        const { error: insErr } = await supabase.from("app_challenge_material").insert({
          id,
          challenge_id: challengeId,
          session_id: sessionId,
          timing,
          title: t,
          note: note.trim() || null,
          storage_path: path,
          file_name: file!.name,
          file_size_bytes: file!.size,
          mime_type: file!.type,
          uploaded_by: user.id,
        });
        if (insErr) {
          await supabase.storage.from(BUCKET).remove([path]);
          throw new Error(insErr.message);
        }
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the material.");
      setBusy(false);
    }
  }

  if (!mounted) return null;

  const close = () => {
    clearSheetDraft();
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(15,34,41,0.14)",
    color: INK,
    backgroundColor: "white",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,34,41,0.45)" }}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={existing ? "Edit material" : "Attach material"}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "#FFFFFF", maxHeight: "min(86vh, 640px)", boxShadow: "0 24px 60px rgba(15,34,41,0.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid rgba(15,34,41,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: ORANGE }} />
            <h2 className="text-lg font-black font-headline tracking-tight" style={{ color: INK, letterSpacing: "-0.02em" }}>
              {existing ? "Edit material" : "Attach material"}
            </h2>
          </div>
          <p className="text-[12px] mt-1 ml-[14px]" style={{ color: "#64748b" }}>
            Materials ride the session&apos;s clock: before-materials prepare
            people for the room, after-materials come out of it.
          </p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">
          {/* FILE */}
          {existing ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "#FAF9F6", border: "1px solid rgba(15,34,41,0.08)" }}
            >
              <span style={{ color: CYAN }}>{FILE_GLYPH}</span>
              <span className="text-[12px] font-bold font-headline truncate flex-1" style={{ color: INK }}>
                {existing.file_name}
              </span>
              <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                {fmtSize(existing.file_size_bytes)} · to change the file, remove and re-attach
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl px-4 py-5 text-center transition-colors hover:bg-[rgba(255,97,48,0.03)]"
              style={{ border: `1.5px dashed ${file ? "rgba(8,145,178,0.5)" : "rgba(255,97,48,0.4)"}` }}
            >
              {file ? (
                <span className="inline-flex items-center gap-2">
                  <span style={{ color: CYAN }}>{FILE_GLYPH}</span>
                  <span className="text-[13px] font-bold font-headline" style={{ color: INK }}>{file.name}</span>
                  <span className="text-[11px]" style={{ color: "#94a3b8" }}>{fmtSize(file.size)}</span>
                </span>
              ) : (
                <>
                  <span className="block text-[13px] font-black font-headline" style={{ color: ORANGE }}>
                    Choose a file
                  </span>
                  <span className="block text-[11px] mt-1" style={{ color: "#94a3b8" }}>
                    PDF, image, Word or Excel · up to 20 MB
                  </span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={Object.keys(ALLOWED_MIME).join(",")}
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="hidden"
          />

          {/* TITLE + NOTE */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Title, e.g. Week 2 meal structure"
            className="w-full h-10 rounded-xl px-3 text-sm outline-none"
            style={inputStyle}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            placeholder="Optional note to your tribe, e.g. fill this in before we meet"
            className="w-full h-10 rounded-xl px-3 text-xs outline-none"
            style={inputStyle}
          />

          {/* TIMING */}
          <div className="space-y-2">
            <TimingOption
              active={timing === "after"}
              onClick={() => setTiming("after")}
              accent={CYAN}
              title="After the session"
              body="Released when the session ends. The recap, the template you talked through."
            />
            <TimingOption
              active={timing === "before_24h"}
              onClick={() => setTiming("before_24h")}
              accent={ORANGE}
              title="Before · 24 hours ahead"
              body="Something to bring or have ready."
            />
            <TimingOption
              active={timing === "before_1w"}
              onClick={() => setTiming("before_1w")}
              accent={ORANGE}
              title="Before · 1 week ahead"
              body="Preparation that needs time: a food diary, equipment to get."
            />
          </div>

          {error && (
            <p className="text-xs font-bold" style={{ color: "#dc2626" }}>{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="flex-1 rounded-full py-3 px-5 text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: ORANGE, fontWeight: 700, boxShadow: "0 4px 14px rgba(255,97,48,0.30)" }}
            >
              {busy ? "Saving…" : existing ? "Save changes" : "Attach →"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="px-3 py-2.5 text-xs font-bold font-headline disabled:opacity-40"
              style={{ color: "#94a3b8" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TimingOption({
  active,
  onClick,
  accent,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl px-3.5 py-2.5 transition-colors"
      style={{
        backgroundColor: active ? `${accent}0D` : "#FFFFFF",
        border: `1.5px solid ${active ? `${accent}66` : "rgba(15,34,41,0.10)"}`,
      }}
      aria-pressed={active}
    >
      <span className="flex items-center gap-2">
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center"
          style={{ border: `2px solid ${active ? accent : "rgba(15,34,41,0.22)"}` }}
        >
          {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />}
        </span>
        <span className="text-[13px] font-black font-headline" style={{ color: INK }}>{title}</span>
      </span>
      <span className="block text-[11px] leading-snug mt-0.5 ml-[22px]" style={{ color: "#64748b" }}>
        {body}
      </span>
    </button>
  );
}
