import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The social-share card (1200x630). Rendered once at build via next/og
 * (Satori) into a static PNG, so it needs no runtime network: the brand font
 * ships in-repo (app/_og/fonts) and the mark is read off disk. Next injects
 * og:image with a content hash in the URL, so a change here is a new URL and
 * no CDN serves the old one. Twitter reuses it via summary_large_image.
 *
 * REBUILT ON THE STAGE (17 Sep 2026). The card still carried the pre-network
 * story ("Complementary experts, one live fitness experience", a CLOSED PILOT
 * pill) on a cream ground with two soft radial washes standing in for the
 * brand field. Someone sharing the link got a banner that matched neither the
 * page nor the brand.
 *
 * It is now the hero itself: the dark teal stage, the real wave paths from
 * BrandWaves (never redrawn, only re-stopped, roughly doubled from the stage
 * values because a 1200x630 card is seen for half a second and the page's
 * whisper reads as nothing at that size), and the hero couplet in its own two
 * tones.
 *
 * The card, the og:title and the og:description say three different things on
 * purpose: the claim, the slogan, and what it actually is.
 */

export const alt = "INFITRA · Offer more without becoming everything.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// brand tokens (mirror app/landing/ui.tsx and components/BrandWaves.tsx)
const ORANGE = "#FF6130";
const CYAN_BRIGHT = "#9CF0FF";
const TEAL = "#0C262E";
const CREAM = "#F2EFE8";

// The wave paths, verbatim from components/BrandWaves.tsx.
const PATH_1 =
  "M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z";
const PATH_3 =
  "M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z";

export default async function Image() {
  const [medium, bold, mark] = await Promise.all([
    readFile(join(process.cwd(), "app/_og/fonts/GeneralSans-Medium.ttf")),
    readFile(join(process.cwd(), "app/_og/fonts/GeneralSans-Bold.ttf")),
    readFile(join(process.cwd(), "app/_og/logo-mark.png")),
  ]);
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 80px",
          backgroundColor: TEAL,
          fontFamily: "General Sans",
          position: "relative",
        }}
      >
        {/* The stage's own wave field. "none" stretches the bands across a
           wide shallow frame, which is what StageWaves was drawn for. */}
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="none"
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="og-d1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="0.26" />
              <stop offset="40%" stopColor={CYAN_BRIGHT} stopOpacity="0.10" />
              <stop offset="52%" stopColor={TEAL} stopOpacity="0" />
              <stop offset="64%" stopColor={ORANGE} stopOpacity="0.16" />
              <stop offset="100%" stopColor={ORANGE} stopOpacity="0.36" />
            </linearGradient>
            <linearGradient id="og-d2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="0.15" />
              <stop offset="50%" stopColor={TEAL} stopOpacity="0" />
              <stop offset="100%" stopColor={ORANGE} stopOpacity="0.22" />
            </linearGradient>
          </defs>
          <path d={PATH_1} fill="url(#og-d1)" />
          <path d={PATH_3} fill="url(#og-d2)" />
        </svg>

        {/* lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={88} height={88} style={{ borderRadius: 20 }} alt="" />
          <span style={{ fontSize: 48, fontWeight: 700, color: ORANGE, letterSpacing: "-0.03em" }}>
            INFITRA
          </span>
        </div>

        {/* the hero couplet, verbatim and in the hero's own two tones */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 72, fontWeight: 700, color: ORANGE, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Offer more
          </span>
          <span style={{ fontSize: 72, fontWeight: 700, color: CYAN_BRIGHT, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            without becoming everything.
          </span>
        </div>

        {/* footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 22px",
              borderRadius: 999,
              backgroundColor: "rgba(156,240,255,0.10)",
              color: CYAN_BRIGHT,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ display: "flex", width: 10, height: 10, borderRadius: 999, backgroundColor: CYAN_BRIGHT }} />
            THE FOUNDING NETWORK IS TAKING SHAPE
          </span>
          <span style={{ fontSize: 23, fontWeight: 700, color: CREAM, letterSpacing: "-0.01em" }}>infitra.fit</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "General Sans", data: medium, style: "normal", weight: 500 },
        { name: "General Sans", data: bold, style: "normal", weight: 700 },
      ],
    }
  );
}
