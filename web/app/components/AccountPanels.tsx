"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OverlayPanel, OverlaySection } from "./DashboardOverlay";
import { VisibilityToggle } from "./VisibilityToggle";
import { ProfileEditForm, type ProfileFacts } from "./ProfileEditForm";
import { ConnectionsGrid, type ConnectionRow } from "./ConnectionsGrid";

/**
 * AccountPanels — the three account overlays shared by both dashboards
 * (founder's coherence pass): Account settings, Edit profile, Your people.
 * Each declares an OverlayPanel; the rails open them by id. Data arrives as
 * props from the server page — the panels render, they don't fetch.
 */

export interface AgreementRow {
  id: string;
  title: string | null;
  status: string;
  start_date: string | null;
}

export function AccountSettingsPanel({
  visibility,
  agreements,
}: {
  visibility: string;
  agreements: AgreementRow[];
}) {
  return (
    <OverlayPanel id="settings" title="Account settings">
      <OverlaySection label="Profile visibility">
        <VisibilityToggle initial={visibility} />
      </OverlaySection>

      {agreements.length > 0 && (
        <OverlaySection
          label="My agreements"
          intro="Every collaboration agreement you are part of, recorded at the moment it was locked. Open one to read or export it."
        >
          <ul className="space-y-2">
            {agreements.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/collaborate/${a.id}/contract`}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "#FAF9F6", border: "1px solid rgba(15,34,41,0.08)" }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-black font-headline truncate" style={{ color: "#0F2229" }}>
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
        </OverlaySection>
      )}
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
      intro="Real connections from real experiences: everyone you have trained with, and every expert you have built with."
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
