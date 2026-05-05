"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/components/ProfileEditForm";

/**
 * Identity strip — the "this is you" beat at the top of the dashboard.
 *
 * Polished version (Bundle 2.9):
 *   - Cover image renders as a subtle blurred background band when
 *     the user has uploaded one. Without it, falls back to the
 *     default warm-cream surface.
 *   - Avatar grew from 48px to 64px — gives the user real presence.
 *   - Tagline lifted from light-grey to dark slate weight 600 so it
 *     reads as a real subtitle, not a footer.
 *   - "On the Pilot" pill replaced with an interpretive line:
 *     "On the pilot · N weeks in". Anchors the user in their journey
 *     rather than just badging them.
 *
 * Compact, single-row, no card chrome. The notification bell + name +
 * sign-out remain in the top nav (layout.tsx); this strip adds the
 * personal touch underneath.
 */

interface Props {
  displayName: string;
  avatarUrl: string | null;
  tagline: string | null;
  bio: string | null;
  coverImageUrl: string | null;
  /** ISO timestamp of the user's profile creation. Drives the
   *  "N weeks in" interpretive line. */
  joinedAt: string | null;
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function weeksSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

function pilotLine(joinedAt: string | null): string {
  const w = weeksSince(joinedAt);
  if (w === null) return "On the pilot";
  if (w === 0) return "On the pilot · just joined";
  if (w === 1) return "On the pilot · 1 week in";
  return `On the pilot · ${w} weeks in`;
}

export function IdentityStrip({
  displayName,
  avatarUrl,
  tagline,
  bio,
  coverImageUrl,
  joinedAt,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const firstName = displayName.split(" ")[0] || displayName;
  const initial = (firstName[0] ?? "?").toUpperCase();
  const greeting = timeOfDayGreeting();

  return (
    <>
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          // Subtle cream surface when no cover; cover image takes
          // over when present.
          backgroundColor: coverImageUrl ? "#0F2229" : "rgba(255,255,255,0.55)",
          border: "1px solid rgba(15,34,41,0.06)",
        }}
      >
        {coverImageUrl && (
          <>
            <img
              src={coverImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "blur(24px) saturate(1.1)", transform: "scale(1.1)" }}
            />
            {/* Dark veil over the cover for legibility of the text on top */}
            <div
              className="absolute inset-0"
              style={{ background: "rgba(15,34,41,0.55)" }}
            />
          </>
        )}

        <div className="relative flex items-center gap-5 px-6 py-5">
          {/* Avatar with brand cyan ring — bigger now (64px) for real presence */}
          <div className="shrink-0 rounded-full p-[2px]" style={{ background: "#9CF0FF" }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover block"
                style={{ border: "2px solid #FFFFFF" }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  border: "2px solid #FFFFFF",
                  backgroundColor: "rgba(255,97,48,0.18)",
                }}
              >
                <span
                  className="text-xl font-headline"
                  style={{ color: "#FF6130", fontWeight: 700 }}
                >
                  {initial}
                </span>
              </div>
            )}
          </div>

          {/* Identity text — tighter hierarchy, more weight */}
          <div className="min-w-0 flex-1">
            <p
              className="text-lg md:text-xl font-headline tracking-tight"
              style={{
                color: coverImageUrl ? "#FFFFFF" : "#0F2229",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {greeting}, {firstName}
            </p>
            {tagline && (
              <p
                className="text-sm md:text-base truncate mt-0.5"
                style={{
                  color: coverImageUrl ? "rgba(255,255,255,0.85)" : "#475569",
                  fontWeight: 600,
                }}
              >
                {tagline}
              </p>
            )}
            <p
              className="text-[10px] uppercase tracking-widest font-headline mt-2"
              style={{
                color: coverImageUrl ? "#9CF0FF" : "#0891b2",
                fontWeight: 700,
              }}
            >
              {pilotLine(joinedAt)}
            </p>
          </div>

          {/* Edit profile — quiet trailing action, adapts to bg tone */}
          <button
            onClick={() => setEditOpen(true)}
            className="shrink-0 px-4 py-2 rounded-full text-xs font-headline transition-colors"
            style={{
              color: coverImageUrl ? "#FFFFFF" : "#475569",
              border: coverImageUrl
                ? "1px solid rgba(255,255,255,0.40)"
                : "1px solid rgba(15,34,41,0.10)",
              backgroundColor: coverImageUrl
                ? "rgba(255,255,255,0.10)"
                : "rgba(255,255,255,0.55)",
              fontWeight: 700,
              backdropFilter: coverImageUrl ? "blur(8px)" : undefined,
            }}
          >
            Edit profile
          </button>
        </div>
      </div>

      <SlideOver open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <ProfileEditForm
          displayName={displayName}
          tagline={tagline ?? ""}
          bio={bio ?? ""}
          avatarUrl={avatarUrl}
          coverUrl={coverImageUrl}
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
