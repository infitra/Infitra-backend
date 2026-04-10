"use client";

/**
 * WaveFlowingBackground — INFITRA's default app background.
 *
 * Three layered SVG paths drawn natively as diagonal wavy stripes that
 * bend from the lower-left toward the upper-right of the viewport.
 * Each stripe is filled with the brand cyan→white→orange gradient.
 *
 * Two motion sources, both staying perfectly anchored to the viewport
 * corners (no spatial transform):
 *   1. SMIL animation on Wave 1's <feGaussianBlur stdDeviation> — the
 *      broad blurred backdrop visibly breathes between sharper (8px)
 *      and softer (28px) blur over 9s.
 *   2. CSS opacity pulses on each wave layer with independent cycles
 *      (7s / 5s / 6s) so the cumulative colour amount fluctuates
 *      organically over time.
 *
 * No CSS filter brightness/saturate — brand colours stay exactly
 * #9CF0FF and #FF6130 at every moment.
 *
 * Designed to sit fixed to the viewport behind all (app) content. Use
 * inside an outer wrapper with `bg-[#F2EFE8] relative overflow-hidden`
 * and put your content in a `relative z-10` div on top.
 */
export function WaveFlowingBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Wave 1 — back, biggest, heavily blurred. SVG blur stdDeviation
          animates 8↔28 so the broad backdrop visibly breathes. */}
      <div
        className="absolute inset-0"
        style={{
          animation: "wave-pulse-1 7s ease-in-out infinite",
          willChange: "opacity",
        }}
      >
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="wfg-flow-1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.92" />
              <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.62" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.40" />
              <stop offset="65%" stopColor="#FF6130" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#FF6130" stopOpacity="0.92" />
            </linearGradient>
            <filter id="wfg-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18">
                <animate
                  attributeName="stdDeviation"
                  values="8;28;8"
                  dur="9s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.5 0 0.5 1;0.5 0 0.5 1"
                />
              </feGaussianBlur>
            </filter>
          </defs>
          <path
            d="M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z"
            fill="url(#wfg-flow-1)"
            filter="url(#wfg-blur)"
          />
        </svg>
      </div>

      {/* Wave 2 — middle layer, fastest opacity dim/peak */}
      <div
        className="absolute inset-0"
        style={{
          animation: "wave-pulse-2 5s ease-in-out infinite",
          willChange: "opacity",
        }}
      >
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="wfg-flow-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.92" />
              <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.62" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.40" />
              <stop offset="65%" stopColor="#FF6130" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#FF6130" stopOpacity="0.92" />
            </linearGradient>
          </defs>
          <path
            d="M -300 1500 C 150 1180, 500 1330, 850 980 C 1200 620, 1550 800, 1950 -300 L 1950 -1000 C 1550 -50, 1200 -250, 850 100 C 500 460, 150 250, -300 720 Z"
            fill="url(#wfg-flow-2)"
          />
        </svg>
      </div>

      {/* Wave 3 — front, sharpest, narrower band of pure vivid brand */}
      <div
        className="absolute inset-0"
        style={{
          animation: "wave-pulse-3 6s ease-in-out infinite -1.5s",
          willChange: "opacity",
        }}
      >
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="wfg-flow-3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#FF6130" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d="M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z"
            fill="url(#wfg-flow-3)"
          />
        </svg>
      </div>
    </div>
  );
}
