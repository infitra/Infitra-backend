"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OverlayPanel, OverlaySection } from "./DashboardOverlay";
import { VisibilityToggle } from "./VisibilityToggle";
import { ProfileEditForm, type ProfileFacts } from "./ProfileEditForm";
import { ConnectionsGrid, type ConnectionRow } from "./ConnectionsGrid";

/**
 * AccountPanels — the account overlays shared by both dashboards. Each
 * declares an OverlayPanel; the rails open them by id. Data arrives as props
 * from the server page — the panels render, they don't fetch.
 *
 * Role split (founder's call): experts have NO visibility choice — an
 * expert's profile is always public (their legitimacy IS the product), so
 * their panel is "My recorded agreements" (agreements only). Participants
 * get "Account settings" with the visibility toggle; they hold no
 * agreements.
 */

export interface AgreementRow {
  id: string;
  title: string | null;
  status: string;
  start_date: string | null;
}

const INK = "#0F2229";
const GOLD = "#EAB308";

function AgreementList({ agreements }: { agreements: AgreementRow[] }) {
  if (agreements.length === 0) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: "#94a3b8" }}>
        Your recorded agreements will appear here once you lock your first
        collaboration.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {agreements.map((a) => (
        <li key={a.id}>
          <Link
            href={`/dashboard/collaborate/${a.id}/contract`}
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "#FAF9F6", border: "1px solid rgba(15,34,41,0.08)" }}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-black font-headline truncate" style={{ color: INK }}>
                {a.title || "Untitled experience"}
              </span>
              <span className="block text-[11px]" style={{ color: "#94a3b8" }}>
                {a.start_date ? `Starts ${a.start_date}` : "Draft"} · {a.status}
              </span>
            </span>
            <span className="text-[11px] font-black font-headline shrink-0" style={{ color: "#0891b2" }}>
              Open →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Expert: agreements only — no visibility choice, expert profiles are
 *  always public. Opens under the id "settings" so the rails stay uniform. */
export function AgreementsPanel({ agreements }: { agreements: AgreementRow[] }) {
  return (
    <OverlayPanel
      id="settings"
      title="My recorded agreements"
      intro="Every collaboration agreement you are part of, recorded at the moment it was locked. Open one to read or export it."
    >
      <OverlaySection label={`Agreements · ${agreements.length}`}>
        <AgreementList agreements={agreements} />
      </OverlaySection>
    </OverlayPanel>
  );
}

/** Participant: visibility only. */
export function AccountSettingsPanel({ visibility }: { visibility: string }) {
  return (
    <OverlayPanel id="settings" title="Account settings">
      <OverlaySection label="Profile visibility">
        <VisibilityToggle initial={visibility} />
      </OverlaySection>
    </OverlayPanel>
  );
}

export function EditProfilePanel({
  displayName,
  tagline,
  bio,
  avatarUrl,
  isCreator,
  initialFacts,
}: {
  displayName: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  isCreator: boolean;
  initialFacts: ProfileFacts;
}) {
  const router = useRouter();
  return (
    <OverlayPanel id="edit-profile" title="Edit profile">
      <ProfileEditForm
        displayName={displayName}
        tagline={tagline}
        bio={bio}
        avatarUrl={avatarUrl}
        isCreator={isCreator}
        initialFacts={initialFacts}
        onSaved={() => {
          setTimeout(() => router.refresh(), 600);
        }}
      />
    </OverlayPanel>
  );
}

export function PeoplePanel({
  connections,
  isExpert,
}: {
  connections: ConnectionRow[];
  isExpert: boolean;
}) {
  const collaborators = connections.filter((r) => r.kind === "collaborator");
  const tribe = connections.filter((r) => r.kind !== "collaborator");
  return (
    <OverlayPanel
      id="people"
      title="Your people"
      intro={
        isExpert
          ? "Real connections from real experiences: everyone you have trained with, and every expert you have built with."
          : "Real connections from real experiences: everyone you have trained with, and the experts who led you."
      }
      wide
    >
      {isExpert && collaborators.length > 0 && (
        <OverlaySection label={`My collaborators · ${collaborators.length}`}>
          <ConnectionsGrid rows={collaborators} />
        </OverlaySection>
      )}
      <OverlaySection label={`Tribe connections · ${tribe.length}`}>
        <ConnectionsGrid rows={tribe} />
      </OverlaySection>
    </OverlayPanel>
  );
}

// ─── Reviews — every review across the expert's experiences ──

export interface ExpertReview {
  id: string;
  challengeId: string;
  challengeTitle: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string | null;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-[1px]" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={i <= n ? GOLD : "none"}
          stroke={i <= n ? GOLD : "rgba(15,34,41,0.25)"}
          strokeWidth={1.8}
        >
          <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * ReviewsPanel — opened from the rating stat card: EVERY review across the
 * expert's experiences, filterable per experience. The per-experience card
 * keeps its own scoped disclosure; this is the account-wide view.
 */
export function ReviewsPanel({ reviews }: { reviews: ExpertReview[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const byExperience = new Map<string, string>();
  for (const r of reviews) byExperience.set(r.challengeId, r.challengeTitle);
  const shown = filter ? reviews.filter((r) => r.challengeId === filter) : reviews;
  const avg = shown.length
    ? shown.reduce((n, r) => n + r.rating, 0) / shown.length
    : 0;

  return (
    <OverlayPanel id="reviews" title="Your reviews" wide>
      {reviews.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: "#94a3b8" }}>
          Reviews from your participants will collect here after your first
          experience wraps.
        </p>
      ) : (
        <>
          {/* Filter — All + one chip per experience that has reviews. */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <FilterChip active={filter === null} label={`All · ${reviews.length}`} onClick={() => setFilter(null)} />
            {[...byExperience.entries()].map(([id, title]) => (
              <FilterChip
                key={id}
                active={filter === id}
                label={title}
                onClick={() => setFilter(id)}
              />
            ))}
          </div>

          <p className="text-[13px] font-black font-headline mb-3" style={{ color: INK }}>
            <span style={{ color: GOLD }}>★ {avg.toFixed(1)}</span>{" "}
            <span style={{ color: "#94a3b8", fontWeight: 700 }}>
              across {shown.length} {shown.length === 1 ? "review" : "reviews"}
            </span>
          </p>

          <ul className="space-y-2.5">
            {shown.map((r) => (
              <li
                key={r.id}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(15,34,41,0.08)" }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Stars n={r.rating} />
                    <span className="text-[12px] font-bold font-headline truncate" style={{ color: INK }}>
                      {r.reviewerName ?? "A participant"}
                    </span>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: "#94a3b8" }}>
                    {r.challengeTitle} · {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: "#475569" }}>
                    {r.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </OverlayPanel>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[11px] font-black font-headline transition-colors max-w-[220px] truncate"
      style={
        active
          ? { backgroundColor: "#0891b2", color: "#FFFFFF" }
          : { backgroundColor: "rgba(8,145,178,0.07)", color: "#0891b2", border: "1px solid rgba(8,145,178,0.20)" }
      }
    >
      {label}
    </button>
  );
}
