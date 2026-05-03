"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/components/ProfileEditForm";

/**
 * Profile Overview — the identity sidebar of the pilot dashboard.
 *
 * Lives in a 1/3 sidebar slot on desktop (alongside the active
 * program hero in the right 2/3). Stacks above the program on
 * mobile. Reads as supporting context to the focal program, not a
 * standalone section.
 *
 *   ┌─────────────────────────┐
 *   │ [Cover band - if any]   │
 *   │                         │
 *   │ [Avatar 80px]           │
 *   │                         │
 *   │ Display Name            │
 *   │ Tagline                 │
 *   │ Bio (2-3 lines)         │
 *   │                         │
 *   │ ─── Lifetime ───        │
 *   │ CHF 480    Earned →     │
 *   │ 5          Sessions     │
 *   │ 12         Members      │
 *   │                         │
 *   │ [Edit profile]          │
 *   └─────────────────────────┘
 *
 * Stats are *labelled value rows* (not the previous big stat-cards
 * grid). In a narrow column the row pattern reads as a real
 * dashboard sidebar; the cards-in-a-row pattern compressed into a
 * sidebar would feel cramped.
 */

interface Props {
  profile: {
    displayName: string;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    tagline: string | null;
    bio: string | null;
  };
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function ManageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-[#0F2229]/[0.04] group"
    >
      <span
        className="text-[11px] uppercase tracking-widest font-headline"
        style={{ color: "#475569", fontWeight: 700 }}
      >
        {label}
      </span>
      <span
        className="text-[11px] font-headline transition-colors"
        style={{ color: "#94a3b8", fontWeight: 700 }}
      >
        →
      </span>
    </Link>
  );
}

export function ProfileOverview({ profile }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const greeting = timeOfDayGreeting();
  const firstName = profile.displayName.split(" ")[0] || profile.displayName;
  const initial = (firstName[0] ?? "?").toUpperCase();
  const hasCover = !!profile.coverImageUrl;

  return (
    <>
      <div
        className="rounded-3xl overflow-hidden infitra-card h-full flex flex-col"
        style={{ border: "1px solid rgba(15,34,41,0.08)" }}
      >
        {/* Cover band — only when an actual cover image exists. */}
        {hasCover ? (
          <div className="relative h-20 overflow-hidden bg-[#0F2229] shrink-0">
            <img
              src={profile.coverImageUrl as string}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 100%)",
              }}
            />
          </div>
        ) : null}

        {/* Body — flex column so the edit button always anchors at the
            bottom and the spacer grows to match the program card's height
            on desktop. */}
        <div className={`flex-1 flex flex-col ${hasCover ? "px-5 pb-5" : "p-5"}`}>
          {/* Avatar — wrapped in a cyan brand-ring so it has identity
              instead of reading as a generic profile pic. Same treatment
              the original CreatorIdentitySection used. */}
          <div className={hasCover ? "-mt-10 mb-4 shrink-0" : "mb-4 shrink-0"}>
            <div
              className="rounded-full p-[2px]"
              style={{
                background: "#9CF0FF",
                boxShadow: hasCover
                  ? "0 6px 20px rgba(15,34,41,0.18)"
                  : "0 4px 14px rgba(8,145,178,0.20)",
                width: "fit-content",
              }}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover block"
                  style={{ border: "2px solid #FFFFFF" }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    border: "2px solid #FFFFFF",
                    backgroundColor: "rgba(255,97,48,0.18)",
                  }}
                >
                  <span
                    className="text-2xl font-headline"
                    style={{ color: "#FF6130", fontWeight: 700 }}
                  >
                    {initial}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Identity */}
          <div className="shrink-0">
            <p
              className="text-[10px] uppercase tracking-widest font-headline mb-1"
              style={{ color: "#94a3b8", fontWeight: 700 }}
            >
              {greeting}, {firstName}
            </p>
            <h1
              className="text-xl md:text-2xl font-headline tracking-tight leading-tight"
              style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              {profile.displayName || firstName}
            </h1>
            {profile.tagline ? (
              <p
                className="text-sm mt-1.5"
                style={{ color: "#475569", fontWeight: 600 }}
              >
                {profile.tagline}
              </p>
            ) : null}
            {profile.bio ? (
              <p
                className="text-[13px] mt-3 leading-relaxed"
                style={{ color: "#64748b" }}
              >
                {profile.bio}
              </p>
            ) : null}
          </div>

          {/* Pilot status block — fills the middle of the card with
              brand-meaningful content instead of empty spacer. Tells
              the creator they're in the closed cohort, gives the card
              actual structure, gives the pilot a sense of place. */}
          <div
            className="mt-5 pt-4 border-t shrink-0"
            style={{ borderColor: "rgba(15,34,41,0.08)" }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.2em] font-headline mb-2"
              style={{ color: "#94a3b8", fontWeight: 700 }}
            >
              Status
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: "#0891b2",
                  boxShadow: "0 0 6px rgba(8,145,178,0.55)",
                }}
              />
              <p
                className="text-sm font-headline"
                style={{ color: "#0F2229", fontWeight: 700 }}
              >
                On the Pilot
                <span
                  className="ml-2 text-[10px] uppercase tracking-widest"
                  style={{ color: "#94a3b8", fontWeight: 700 }}
                >
                  Closed cohort
                </span>
              </p>
            </div>
          </div>

          {/* Spacer pushes the Manage footer to the bottom so the
              sidebar visually matches the program card height. */}
          <div className="flex-1" />

          {/* Manage — quick links to dedicated pages. The dashboard
              isn't where lifetime numbers live; those belong on their
              own pages. This footer is just navigation. */}
          <div
            className="mt-5 pt-4 border-t shrink-0"
            style={{ borderColor: "rgba(15,34,41,0.08)" }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.2em] font-headline mb-1"
              style={{ color: "#94a3b8", fontWeight: 700 }}
            >
              Manage
            </p>
            <ManageLink href="/dashboard/earnings" label="Earnings" />
            <button
              onClick={() => setEditOpen(true)}
              className="w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-[#0F2229]/[0.04]"
            >
              <span
                className="text-[11px] uppercase tracking-widest font-headline"
                style={{ color: "#475569", fontWeight: 700 }}
              >
                Edit profile
              </span>
              <span
                className="text-[11px] font-headline"
                style={{ color: "#94a3b8", fontWeight: 700 }}
              >
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      <SlideOver
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
      >
        <ProfileEditForm
          displayName={profile.displayName}
          tagline={profile.tagline ?? ""}
          bio={profile.bio ?? ""}
          avatarUrl={profile.avatarUrl}
          coverUrl={profile.coverImageUrl}
          onSaved={() => {
            setTimeout(() => {
              setEditOpen(false);
              router.refresh();
            }, 800);
          }}
        />
      </SlideOver>
    </>
  );
}
