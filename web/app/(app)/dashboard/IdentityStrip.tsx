"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/components/ProfileEditForm";

/**
 * Identity strip — thin top bar of the dashboard.
 *
 * Replaces the previous full ProfileOverview sidebar card. The
 * dashboard is the *programs hub*; identity needs to be present (this
 * is YOUR home) but not compete with the programs zone for attention.
 *
 * Format:
 *   [Avatar 40] Yves Imhasly · Passionate Trainer focused on...
 *               ⬤ ON THE PILOT                            [Edit ⋯]
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
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

export function IdentityStrip({
  displayName,
  avatarUrl,
  tagline,
  bio,
  coverImageUrl,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const firstName = displayName.split(" ")[0] || displayName;
  const initial = (firstName[0] ?? "?").toUpperCase();
  const greeting = timeOfDayGreeting();

  return (
    <>
      <div className="flex items-center gap-4 px-2">
        {/* Avatar with brand cyan ring */}
        <div className="shrink-0 rounded-full p-[2px]" style={{ background: "#9CF0FF" }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover block"
              style={{ border: "2px solid #FFFFFF" }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                border: "2px solid #FFFFFF",
                backgroundColor: "rgba(255,97,48,0.18)",
              }}
            >
              <span className="text-base font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Identity text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-base md:text-lg font-headline"
              style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.01em" }}
            >
              {greeting}, {firstName}
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline"
              style={{
                color: "#0891b2",
                backgroundColor: "rgba(8,145,178,0.08)",
                border: "1px solid rgba(8,145,178,0.20)",
                fontWeight: 700,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "#0891b2" }}
              />
              On the Pilot
            </span>
          </div>
          {tagline ? (
            <p className="text-xs md:text-sm truncate" style={{ color: "#64748b" }}>
              {tagline}
            </p>
          ) : null}
        </div>

        {/* Edit profile — quiet trailing action */}
        <button
          onClick={() => setEditOpen(true)}
          className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-headline transition-colors hover:bg-[#0F2229]/[0.05]"
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
