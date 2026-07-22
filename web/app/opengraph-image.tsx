import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The social-share card (1200x630). Rendered once at build via next/og
 * (Satori) into a static PNG, so it needs no runtime network — the brand
 * font ships in-repo (app/_og/fonts) and the mark is read off disk. Next
 * auto-injects og:image (+ width/height/type); twitter reuses it via the
 * summary_large_image card set in the root metadata.
 *
 * The card echoes the landing: cream canvas, a soft cyan->orange wave wash,
 * and the real hero couplet in the brand's two tones.
 */

export const alt = "INFITRA · Complementary experts, one live fitness experience.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// brand tokens (mirror app/landing/ui.tsx)
const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const MUTED = "#475569";
const CREAM = "#F2EFE8";

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
          padding: "72px 80px",
          backgroundColor: CREAM,
          fontFamily: "General Sans",
          position: "relative",
        }}
      >
        {/* the wave wash — two soft brand glows, echoing the site background */}
        <div
          style={{
            position: "absolute",
            top: -280,
            left: -220,
            width: 900,
            height: 900,
            background: "radial-gradient(circle at center, rgba(8,145,178,0.20), rgba(8,145,178,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -260,
            bottom: -320,
            width: 1000,
            height: 1000,
            background: "radial-gradient(circle at center, rgba(255,97,48,0.22), rgba(255,97,48,0) 62%)",
          }}
        />

        {/* lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={64} height={64} style={{ borderRadius: 14 }} alt="" />
          <span style={{ fontSize: 34, fontWeight: 700, color: ORANGE, letterSpacing: "-0.03em" }}>
            INFITRA
          </span>
        </div>

        {/* the hero couplet, verbatim */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: -8 }}>
          <span style={{ fontSize: 82, fontWeight: 700, color: ORANGE, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
            Complementary experts,
          </span>
          <span style={{ fontSize: 82, fontWeight: 700, color: CYAN, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
            one live fitness experience.
          </span>
          <span style={{ display: "flex", fontSize: 27, fontWeight: 500, color: MUTED, marginTop: 26, maxWidth: 940, lineHeight: 1.4 }}>
            Team up with a complementary expert for one seamless live experience. The rooms, the tribe, the checkout, the contract and the split: handled.
          </span>
        </div>

        {/* footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(8,145,178,0.10)",
              color: CYAN,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ display: "flex", width: 10, height: 10, borderRadius: 999, backgroundColor: CYAN }} />
            CLOSED PILOT · APPLICATIONS OPEN
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>infitra.fit</span>
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
