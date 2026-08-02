/**
 * CredentialIcon — brand-native glyphs for the credential kinds.
 *
 * Replaces the emoji set (📜🎓💼): emoji render as heavy, dark, platform-
 * specific artwork — the scroll in particular read as a medieval document —
 * which fought the light stroke language everywhere else. These are 1.6px
 * outline icons that inherit `color`, so they sit in the page's palette
 * instead of importing another one.
 */

export type CredentialKind = "certification" | "education" | "experience";

export function CredentialIcon({
  kind,
  size = 14,
  className,
}: {
  kind: string;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  if (kind === "education") {
    // Graduation cap
    return (
      <svg {...common}>
        <path d="M22 9L12 4 2 9l10 5 10-5z" />
        <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      </svg>
    );
  }

  if (kind === "experience") {
    // Briefcase
    return (
      <svg {...common}>
        <rect x="2.5" y="7.5" width="19" height="12" rx="2" />
        <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M2.5 12.5h19" />
      </svg>
    );
  }

  // certification — award medal
  return (
    <svg {...common}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.6 13.7L7.5 20.5l4.5-2.3 4.5 2.3-1.1-6.8" />
    </svg>
  );
}

/** "2019" · "2018–2020" · "" — one place, so every surface agrees. */
export function credentialPeriod(year: number | null, yearEnd: number | null): string {
  if (!year) return "";
  return yearEnd && yearEnd !== year ? `${year}–${yearEnd}` : `${year}`;
}
