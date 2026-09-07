"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCommunityCard } from "@/app/actions/profile";

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

/**
 * The community-specific half of the card (6 Sep 2026): the sentence, expert
 * or studio, and where the card shows. Visibility is never pre-ticked: the
 * member chooses, and the database stamps the consent time.
 */
export function NetworkCardForm({
  collabWish,
  entityType,
  visibility,
}: {
  collabWish: string;
  entityType: "expert" | "studio";
  visibility: "none" | "members" | "public";
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
  const [wish, setWish] = useState(collabWish);
  const [vis, setVis] = useState<"none" | "members" | "public">(visibility);

  const remaining = 200 - wish.length;

  return (
    <form
      action={action}
      className="rounded-3xl p-6 lg:p-8 flex flex-col gap-5"
      style={{
        backgroundColor: "rgba(255,255,255,0.62)",
        border: "1px solid rgba(15,34,41,0.08)",
      }}
    >
      <div>
        <h2 className="text-lg font-black font-headline tracking-tight mb-1" style={{ color: INK }}>
          Your card
        </h2>
        <p className="text-xs" style={{ color: "#64748b" }}>
          One sentence and one choice. This is what the network, and the homepage if you
          allow it, see next to your profile.
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
        <label
          htmlFor="collab_wish"
          className="block text-xs font-bold uppercase tracking-wider mb-2 font-headline"
          style={{ color: "rgba(15,34,41,0.55)" }}
        >
          What would you love to run, and with whom?
        </label>
        <textarea
          id="collab_wish"
          name="collab_wish"
          rows={3}
          maxLength={200}
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder="Six weeks on strength for women over forty, with a nutritionist taking the food half."
          className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm resize-none"
          style={{
            backgroundColor: "rgba(255,255,255,0.78)",
            border: "1px solid rgba(15,34,41,0.15)",
            color: INK,
          }}
        />
        <p className="text-[11px] mt-1.5 text-right" style={{ color: remaining < 20 ? ORANGE : "#94a3b8" }}>
          {remaining}
        </p>
      </div>

      <div>
        <span
          className="block text-xs font-bold uppercase tracking-wider mb-2 font-headline"
          style={{ color: "rgba(15,34,41,0.55)" }}
        >
          You are
        </span>
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
              style={{ backgroundColor: "rgba(255,255,255,0.78)", border: "1px solid rgba(15,34,41,0.15)" }}
            >
              <input
                type="radio"
                name="entity_type"
                value={opt.value}
                defaultChecked={entityType === opt.value}
                className="accent-[#FF6130]"
              />
              <span className="text-sm font-headline font-bold" style={{ color: INK }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span
          className="block text-xs font-bold uppercase tracking-wider mb-2 font-headline"
          style={{ color: "rgba(15,34,41,0.55)" }}
        >
          Where your card shows
        </span>
        <div className="flex flex-col gap-2">
          <label
            className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer select-none"
            style={{
              backgroundColor: vis === "public" ? "rgba(255,97,48,0.06)" : "rgba(255,255,255,0.78)",
              border: `1px solid ${vis === "public" ? "rgba(255,97,48,0.45)" : "rgba(15,34,41,0.15)"}`,
            }}
          >
            <input
              type="radio"
              name="community_visibility"
              value="public"
              checked={vis === "public"}
              onChange={() => setVis("public")}
              className="mt-1 accent-[#FF6130]"
            />
            <span>
              <span className="block text-sm font-headline font-bold" style={{ color: INK }}>
                On infitra.fit and to the network
              </span>
              <span className="block text-xs mt-0.5" style={{ color: "#64748b" }}>
                Founding experts and studios are shown on the homepage. Studios and experts
                looking for a complement find you there.
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
            <input
              type="radio"
              name="community_visibility"
              value="members"
              checked={vis === "members"}
              onChange={() => setVis("members")}
              className="mt-1 accent-[#0891b2]"
            />
            <span>
              <span className="block text-xs font-headline font-bold" style={{ color: INK }}>
                Only to the network for now
              </span>
            </span>
          </label>
          {vis === "none" && (
            <input type="hidden" name="community_visibility" value="none" />
          )}
          {vis !== "none" && (
            <button
              type="button"
              onClick={() => setVis("none")}
              className="self-start text-[11px] font-bold font-headline uppercase tracking-[0.12em] mt-1"
              style={{ color: "#94a3b8" }}
            >
              Hide my card
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-full font-black text-sm hover:scale-[1.01] transition-transform font-headline disabled:opacity-50 text-white"
        style={{
          backgroundColor: vis === "members" ? CYAN : ORANGE,
          boxShadow: vis === "members" ? "0 4px 14px rgba(8,145,178,0.30)" : "0 4px 14px rgba(255,97,48,0.30)",
        }}
      >
        {pending ? "Saving…" : "Save card"}
      </button>
    </form>
  );
}
