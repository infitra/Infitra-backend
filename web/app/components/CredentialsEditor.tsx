"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";

const INK = "#0F2229";
const ORANGE = "#FF6130";

export interface EditableCredential {
  id: string;
  kind: "certification" | "education" | "experience";
  title: string;
  org: string | null;
  year: number | null;
  year_end: number | null;
}

const KIND_META: Record<EditableCredential["kind"], { label: string }> = {
  certification: { label: "Certification" },
  education: { label: "Education" },
  experience: { label: "Experience" },
};

/**
 * Background: certifications, education and experience. Immediate CRUD
 * against app_expert_credential under the caller's own row policies,
 * independent of any form around it (nothing to save). Used by the workspace
 * profile editor and the founding-network card editor.
 *
 * Fetches its own list, scoped to the caller: the select policy exposes
 * every creator's credentials (the buyer page is public), so an unscoped
 * read would list other experts' background here.
 */
export function CredentialsEditor({
  intro,
  onChange,
}: {
  intro: string;
  /** Fires with the current list whenever it changes (live card preview). */
  onChange?: (creds: EditableCredential[]) => void;
}) {
  const [creds, setCreds] = useState<EditableCredential[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<EditableCredential["kind"]>("certification");
  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [year, setYear] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onChange?.(creds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("app_expert_credential")
        .select("id, kind, title, org, year, year_end")
        .eq("profile_id", user.id)
        .order("year", { ascending: false });
      if (alive && data) setCreds(data as EditableCredential[]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function add() {
    const t = title.trim();
    if (t.length < 2) {
      setError("Give the credential a title (at least 2 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const y = year.trim() ? parseInt(year.trim(), 10) : null;
      const yEnd = yearEnd.trim() ? parseInt(yearEnd.trim(), 10) : null;
      if (yEnd !== null && y !== null && yEnd < y) {
        setError("The end year cannot be before the start year.");
        setBusy(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");
      const { data, error: insErr } = await supabase
        .from("app_expert_credential")
        .insert({
          // Explicit even though the column defaults to auth.uid(): the RLS
          // check compares profile_id to the caller, and a missing value
          // reads as an RLS violation rather than a clear error.
          profile_id: user.id,
          kind,
          title: t,
          org: org.trim() || null,
          year: Number.isFinite(y as number) ? y : null,
          year_end: Number.isFinite(yEnd as number) ? yEnd : null,
        })
        .select("id, kind, title, org, year, year_end")
        .single();
      if (insErr) throw new Error(insErr.message);
      setCreds((prev) => [...prev, data as EditableCredential]);
      setTitle("");
      setOrg("");
      setYear("");
      setYearEnd("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the credential.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase.from("app_expert_credential").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      setCreds((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the credential.");
    }
    setBusy(false);
  }

  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    border: "1px solid rgba(0, 0, 0, 0.10)",
  } as const;

  // Inside a larger form, Enter must add the entry, not submit the page.
  const enterAdds = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!busy && title.trim().length >= 2) void add();
    }
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "rgba(255,97,48,0.04)", border: "1px solid rgba(255,97,48,0.18)" }}
    >
      <p className="text-xs font-bold uppercase tracking-wider font-headline mb-1" style={{ color: "#c2410c" }}>
        Background
      </p>
      <p className="text-[11px] mb-3" style={{ color: "#64748b" }}>
        {intro}
      </p>

      {error && (
        <p className="text-xs mb-3" style={{ color: ORANGE }}>
          {error}
        </p>
      )}

      {creds.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {creds.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(15,34,41,0.08)" }}
            >
              <span className="shrink-0" style={{ color: ORANGE }}>
                <CredentialIcon kind={c.kind} size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-bold font-headline" style={{ color: INK }}>
                  {c.title}
                </span>
                {[c.org, credentialPeriod(c.year, c.year_end)].filter(Boolean).length > 0 && (
                  <span style={{ color: "#94a3b8" }}>
                    {" · "}
                    {[c.org, credentialPeriod(c.year, c.year_end)].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={busy}
                className="ml-auto text-[10px] font-bold text-rose-500 hover:text-rose-700 shrink-0"
                aria-label={`Remove ${c.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as EditableCredential["kind"])}
          className="h-9 rounded-lg px-2 text-xs col-span-1"
          style={inputStyle}
        >
          {(Object.keys(KIND_META) as Array<EditableCredential["kind"]>).map((k) => (
            <option key={k} value={k}>
              {KIND_META[k].label}
            </option>
          ))}
        </select>
        <div className="col-span-1 flex items-center gap-1.5">
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={enterAdds}
            placeholder="Year"
            inputMode="numeric"
            maxLength={4}
            className="h-9 w-full rounded-lg px-2.5 text-xs"
            style={inputStyle}
          />
          <span className="text-xs shrink-0" style={{ color: "#94a3b8" }}>
            –
          </span>
          <input
            value={yearEnd}
            onChange={(e) => setYearEnd(e.target.value)}
            onKeyDown={enterAdds}
            placeholder="To"
            inputMode="numeric"
            maxLength={4}
            className="h-9 w-full rounded-lg px-2.5 text-xs"
            style={inputStyle}
          />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={enterAdds}
          placeholder="Title, e.g. BSc Sport Science"
          maxLength={120}
          className="h-9 rounded-lg px-2.5 text-xs col-span-2"
          style={inputStyle}
        />
        <input
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          onKeyDown={enterAdds}
          placeholder="Institution (optional)"
          maxLength={120}
          className="h-9 rounded-lg px-2.5 text-xs col-span-2"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || title.trim().length < 2}
          className="col-span-2 h-9 rounded-full text-xs font-black font-headline text-white disabled:opacity-50"
          style={{ backgroundColor: ORANGE }}
        >
          {busy ? "Saving…" : "+ Add to your background"}
        </button>
      </div>
    </div>
  );
}
