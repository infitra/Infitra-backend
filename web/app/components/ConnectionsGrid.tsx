"use client";

import { ProfileTrigger } from "@/app/components/ProfileModal";

/**
 * ConnectionsGrid — renders the caller's derived connection graph
 * (load_my_connections) as tappable people cards. Shared by /me ("Tribe
 * connections") and the expert dashboard's people page ("Tribe connections"
 * + "My collaborators"). Every card opens the profile modal, whose "YOU & X"
 * strip explains the connection in full.
 *
 * These are REAL connections: derived from shared experiences, never from an
 * accepted invite. The card says the why ("2 experiences together").
 */

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

export interface ConnectionRow {
  profile_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  kind: "member" | "expert" | "collaborator";
  shared_count: number;
  shared_titles: string[] | null;
  any_active: boolean;
}

const KIND_CHIP: Record<ConnectionRow["kind"], { label: string; color: string; bg: string }> = {
  member: { label: "Tribe member", color: CYAN, bg: "rgba(8,145,178,0.08)" },
  expert: { label: "Expert", color: "#c2410c", bg: "rgba(255,97,48,0.10)" },
  collaborator: { label: "Collaborator", color: "#92700c", bg: "rgba(234,179,8,0.12)" },
};

export function ConnectionsGrid({ rows }: { rows: ConnectionRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: "#94a3b8" }}>
        Your connections grow from the experiences you take part in — everyone
        you train with shows up here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {rows.map((r) => {
        const chip = KIND_CHIP[r.kind] ?? KIND_CHIP.member;
        const titles = (r.shared_titles ?? []).filter(Boolean);
        const context =
          r.shared_count > 1
            ? `${r.shared_count} experiences together`
            : titles[0]
              ? `Together in ${titles[0]}`
              : "1 experience together";
        return (
          <ProfileTrigger
            key={r.profile_id}
            profileId={r.profile_id}
            className="w-full text-left cursor-pointer"
          >
            <div
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 w-full transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 4px 14px rgba(15,34,41,0.05)",
              }}
            >
              <CardAvatar src={r.avatar_url} name={r.display_name ?? "?"} accent={chip.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-black font-headline truncate" style={{ color: INK }}>
                    {r.display_name ?? "Member"}
                  </p>
                  {r.any_active && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ORANGE }}
                      title="Active together now"
                    />
                  )}
                </div>
                <span
                  className="inline-block px-1.5 py-[1px] rounded-full text-[8.5px] font-black font-headline uppercase tracking-[0.12em]"
                  style={{ color: chip.color, backgroundColor: chip.bg }}
                >
                  {chip.label}
                </span>
                <p className="text-[11px] truncate mt-0.5" style={{ color: "#94a3b8" }}>
                  {context}
                </p>
              </div>
            </div>
          </ProfileTrigger>
        );
      })}
    </div>
  );
}

function CardAvatar({ src, name, accent }: { src: string | null; name: string; accent: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="w-11 h-11 rounded-full object-cover shrink-0"
        style={{ border: `2px solid ${accent}55` }}
      />
    );
  }
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
      style={{ border: `2px solid ${accent}55`, backgroundColor: `${accent}14` }}
    >
      <span className="text-base font-black font-headline" style={{ color: accent }}>
        {(name[0] ?? "?").toUpperCase()}
      </span>
    </div>
  );
}
