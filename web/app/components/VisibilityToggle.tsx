"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFirstMoves } from "@/app/actions/profile";

/**
 * VisibilityToggle — the account-level privacy switch, moved here off the
 * profile editor (where it sat directly under the optional facts and read as
 * a field rather than an account decision).
 *
 * Public is the default and is encouraged honestly: only what you chose to
 * fill in plus your INFITRA activity is shared, and the product runs on
 * people being visible to each other. Private is a real option, not a
 * threat — it keeps photo and display name so nobody becomes a ghost in
 * their own tribe.
 */

const CYAN = "#0891b2";
const INK = "#0F2229";

export function VisibilityToggle({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial === "private" ? "private" : "public");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(next: "public" | "private") {
    if (next === value || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const prev = value;
    setValue(next);
    const fd = new FormData();
    fd.append("visibility", next);
    const res = await saveFirstMoves(fd);
    if (res && "error" in res && res.error) {
      setValue(prev);
      setError(res.error);
    } else {
      setSaved(true);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div>
      <p className="text-[12px] mb-4" style={{ color: "#64748b" }}>
        INFITRA runs on people seeing each other. Public shares only what you
        chose to put in your profile, plus your activity here.
      </p>

      <div className="space-y-2">
        <Option
          active={value === "public"}
          onClick={() => choose("public")}
          title="Public"
          recommended
          body="Your profile, the details you filled in and your INFITRA activity are visible to people you share an experience with."
        />
        <Option
          active={value === "private"}
          onClick={() => choose("private")}
          title="Private"
          body="Only your photo and display name are shown, so your tribe still recognises you. Everything else stays hidden."
        />
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-xs mt-3 font-bold font-headline" style={{ color: "#0891b2" }}>
          Saved.
        </p>
      )}
    </div>
  );
}

function Option({
  active,
  onClick,
  title,
  body,
  recommended,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl px-4 py-3 transition-colors"
      style={{
        backgroundColor: active ? "rgba(8,145,178,0.07)" : "#FFFFFF",
        border: `1.5px solid ${active ? "rgba(8,145,178,0.45)" : "rgba(15,34,41,0.10)"}`,
      }}
      aria-pressed={active}
    >
      <span className="flex items-center gap-2">
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center"
          style={{ border: `2px solid ${active ? CYAN : "rgba(15,34,41,0.22)"}` }}
        >
          {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CYAN }} />}
        </span>
        <span className="text-[13px] font-black font-headline" style={{ color: INK }}>
          {title}
        </span>
        {recommended && (
          <span
            className="text-[9px] font-black font-headline uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full"
            style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)" }}
          >
            Recommended
          </span>
        )}
      </span>
      <span className="block text-[11.5px] leading-snug mt-1 ml-[22px]" style={{ color: "#64748b" }}>
        {body}
      </span>
    </button>
  );
}
