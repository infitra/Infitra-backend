"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCommunityCard } from "@/app/actions/profile";

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

/**
 * The network half of the card (6 Sep 2026): who you are open to, what you
 * bring, what would complement you, expert or studio, and the two switches.
 *
 * Featuring on infitra.fit is the deal, so it is on by default: the member
 * saves the card to confirm it, and the database stamps the moment. Posts
 * (LinkedIn and the like) are a separate switch, also on by default, with
 * the promise spelled out: a post shows only what the member put in the
 * profile, nothing more. Both can be switched off any time.
 */
export function NetworkCardForm({
  openTo,
  brings,
  seeks,
  entityType,
  visibility,
  announceOk,
}: {
  openTo: string[];
  brings: string;
  seeks: string;
  entityType: "expert" | "studio";
  visibility: "none" | "members" | "public";
  announceOk: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      const res = await saveCommunityCard(prev, fd);
      if (res && "success" in res) setTimeout(() => router.refresh(), 300);
      return res;
    },
    null,
  );
  // Featuring is the deal: a fresh card starts on "on infitra.fit". The save
  // is the confirmation; nothing is public until the member saves.
  const [vis, setVis] = useState<"members" | "public">(visibility === "members" ? "members" : "public");
  const [bringsText, setBringsText] = useState(brings);
  const [seeksText, setSeeksText] = useState(seeks);

  const fieldStyle = {
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(15,34,41,0.15)",
    color: INK,
  } as const;
  const labelCls = "block text-xs font-bold uppercase tracking-wider mb-2 font-headline";
  const labelStyle = { color: "rgba(15,34,41,0.55)" } as const;

  return (
    <form
      action={action}
      className="rounded-3xl p-6 lg:p-8 flex flex-col gap-5"
      style={{ backgroundColor: "rgba(255,255,255,0.62)", border: "1px solid rgba(15,34,41,0.08)" }}
    >
      <div>
        <h2 className="text-lg font-black font-headline tracking-tight mb-1" style={{ color: INK }}>
          Your card
        </h2>
        <p className="text-xs" style={{ color: "#64748b" }}>
          What the network sees next to your profile, and what we use to find you a fit.
        </p>
      </div>

      {state && "error" in state && state.error && (
        <div
          className="p-3 rounded-xl text-sm"
          style={{ backgroundColor: "rgba(255,97,48,0.08)", border: "1px solid rgba(255,97,48,0.25)", color: ORANGE }}
        >
          {state.error}
        </div>
      )}
      {state && "success" in state && (
        <div
          className="p-3 rounded-xl text-sm"
          style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#047857" }}
        >
          Saved.
        </div>
      )}

      <div>
        <span className={labelCls} style={labelStyle}>You are</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "expert", label: "An expert" },
              { value: "studio", label: "A studio or gym" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 cursor-pointer select-none"
              style={fieldStyle}
            >
              <input type="radio" name="entity_type" value={opt.value} defaultChecked={entityType === opt.value} className="accent-[#FF6130]" />
              <span className="text-sm font-headline font-bold" style={{ color: INK }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className={labelCls} style={labelStyle}>Open to collaborate with</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "experts", label: "Experts" },
              { value: "studios", label: "Studios and gyms" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 cursor-pointer select-none"
              style={fieldStyle}
            >
              <input type="checkbox" name="open_to" value={opt.value} defaultChecked={openTo.includes(opt.value)} className="accent-[#FF6130]" />
              <span className="text-sm font-headline font-bold" style={{ color: INK }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="brings" className={labelCls} style={labelStyle}>What you bring</label>
        <textarea
          id="brings"
          name="brings"
          rows={2}
          maxLength={200}
          value={bringsText}
          onChange={(e) => setBringsText(e.target.value)}
          placeholder="e.g. strength coaching for women over forty, a live group that has run for six years"
          className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm resize-none"
          style={fieldStyle}
        />
        <p className="text-[11px] mt-1 text-right" style={{ color: 200 - bringsText.length < 20 ? ORANGE : "#94a3b8" }}>{200 - bringsText.length}</p>
      </div>

      <div>
        <label htmlFor="seeks" className={labelCls} style={labelStyle}>What would complement you</label>
        <textarea
          id="seeks"
          name="seeks"
          rows={2}
          maxLength={200}
          value={seeksText}
          onChange={(e) => setSeeksText(e.target.value)}
          placeholder="e.g. a nutritionist for the same audience, or a studio with a room full of members"
          className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm resize-none"
          style={fieldStyle}
        />
        <p className="text-[11px] mt-1 text-right" style={{ color: 200 - seeksText.length < 20 ? ORANGE : "#94a3b8" }}>{200 - seeksText.length}</p>
      </div>

      <div>
        <span className={labelCls} style={labelStyle}>Where your card shows</span>
        <div className="flex flex-col gap-2">
          <label
            className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer select-none"
            style={{
              backgroundColor: vis === "public" ? "rgba(255,97,48,0.06)" : "rgba(255,255,255,0.78)",
              border: `1px solid ${vis === "public" ? "rgba(255,97,48,0.45)" : "rgba(15,34,41,0.15)"}`,
            }}
          >
            <input type="radio" name="community_visibility" value="public" checked={vis === "public"} onChange={() => setVis("public")} className="mt-1 accent-[#FF6130]" />
            <span>
              <span className="block text-sm font-headline font-bold" style={{ color: INK }}>On infitra.fit and to the network</span>
              <span className="block text-xs mt-0.5" style={{ color: "#64748b" }}>
                The deal: nothing binding, and we feature you and bring you opportunities to take or leave.
              </span>
            </span>
          </label>
          <label
            className="flex items-start gap-3 rounded-xl px-4 py-2.5 cursor-pointer select-none"
            style={{
              backgroundColor: vis === "members" ? "rgba(8,145,178,0.06)" : "rgba(255,255,255,0.78)",
              border: `1px solid ${vis === "members" ? "rgba(8,145,178,0.45)" : "rgba(15,34,41,0.15)"}`,
            }}
          >
            <input type="radio" name="community_visibility" value="members" checked={vis === "members"} onChange={() => setVis("members")} className="mt-1 accent-[#0891b2]" />
            <span className="block text-xs font-headline font-bold" style={{ color: INK }}>Only to the network for now</span>
          </label>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input type="checkbox" name="announce_ok" value="yes" defaultChecked={announceOk} className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[#FF6130]" />
        <span className="text-xs leading-relaxed" style={{ color: INK }}>
          <span className="font-bold font-headline">INFITRA may mention my card in posts</span>, on LinkedIn and the like. A post shows only
          what I put in this profile, nothing more. I can switch this off any time.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-full font-black text-sm hover:scale-[1.01] transition-transform font-headline disabled:opacity-50 text-white"
        style={{
          backgroundColor: vis === "members" ? CYAN : ORANGE,
          boxShadow: vis === "members" ? "0 4px 14px rgba(8,145,178,0.30)" : "0 4px 14px rgba(255,97,48,0.30)",
        }}
      >
        {pending ? "Saving…" : visibility === "none" ? "Save and join the network" : "Save card"}
      </button>
    </form>
  );
}
