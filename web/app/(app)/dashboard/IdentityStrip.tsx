"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/components/ProfileEditForm";

/**
 * Identity strip — the "this is you" beat at the top of the dashboard.
 *
 * Layout reads like a small personal poster:
 *   - Greeting (the "Hello you" — H1)
 *   - Tagline as the subtitle (text-base, slate, weight 600)
 *   - Bio as a real paragraph (clamped to 2 lines, text-sm, slate, weight 400)
 *   - "On the pilot · N weeks in" interpretive footer line
 *
 * Cover image is NOT used here — it's the hero of the public-facing
 * landing/program pages, not of a personal identity card. The strip
 * stays on a clean cream surface with proper typography hierarchy.
 */

interface Props {
  displayName: string;
  avatarUrl: string | null;
  tagline: string | null;
  bio: string | null;
  /** Currently unused on the dashboard — kept on Props because the
   * SlideOver edit form still needs it. */
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
        className="rounded-3xl px-6 py-5 md:px-8 md:py-6"
        style={{
          backgroundColor: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(15,34,41,0.06)",
        }}
      >
        <div className="flex items-start gap-5">
          {/* Avatar — 64px with cyan ring, real presence */}
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

          {/* Identity stack — greeting · tagline · bio · pilot footer */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p
                className="text-lg md:text-xl font-headline tracking-tight"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.01em" }}
              >
                {greeting}, {firstName}
              </p>
              <button
                onClick={() => setEditOpen(true)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-headline transition-colors hover:bg-[#0F2229]/[0.05]"
                style={{
                  color: "#475569",
                  border: "1px solid rgba(15,34,41,0.10)",
                  backgroundColor: "rgba(255,255,255,0.55)",
                  fontWeight: 700,
                }}
              >
                Edit profile
              </button>
            </div>

            {tagline && (
              <p
                className="text-sm md:text-base mt-1"
                style={{ color: "#475569", fontWeight: 600 }}
              >
                {tagline}
              </p>
            )}

            {bio && (
              <p
                className="text-sm mt-2 line-clamp-2 max-w-2xl"
                style={{ color: "#64748b", fontWeight: 400, lineHeight: 1.55 }}
              >
                {bio}
              </p>
            )}

            <p
              className="text-[10px] uppercase tracking-widest font-headline mt-3"
              style={{ color: "#0891b2", fontWeight: 700 }}
            >
              {pilotLine(joinedAt)}
            </p>
          </div>
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
