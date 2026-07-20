"use client";

/**
 * WaveFlowingBackground — INFITRA's default app background.
 *
 * Three layered SVG paths drawn natively as diagonal wavy stripes that
 * bend from the lower-left toward the upper-right of the viewport.
 * Each stripe is filled with the brand cyan→white→orange gradient.
 *
 * Motion — CSS opacity pulses on each wave layer with independent cycles
 * (7s / 5s / 6s) so the cumulative colour amount fluctuates organically
 * over time. Opacity is a compositor-only property (GPU, no repaint), so
 * the flow is effectively free to animate, even page-wide and fixed.
 *
 * The backmost wave's blur is STATIC (stdDeviation 18). It used to animate
 * 8↔28 via SMIL, but animating an SVG filter forces a full-viewport CPU
 * re-rasterisation of a large blur kernel every frame — the dominant
 * scroll-jank cost on long pages. The oscillation was near-imperceptible
 * next to the opacity flow, so it's frozen at the mid value: the waves
 * look identically soft, the per-frame raster cost is gone.
 *
 * Motion respects prefers-reduced-motion (see globals.css): users who opt
 * out of motion get a calm static gradient instead of the pulsing flow.
 *
 * MOBILE (≤lg, see globals.css `.wfg-root` block): the flow is frozen to
 * its static mid-state AND the root is sized with `100lvh` instead of the
 * viewport-tracking `inset-0`. Reason: on iOS Safari the address bar
 * collapses/expands during scroll, resizing the viewport — which would
 * resize this fixed layer and force the big blur to RE-RASTERISE mid-
 * scroll (the dominant mobile scroll-jank cost). `100lvh` is a stable
 * unit that ignores the toolbar toggle, so the blurred layer rasterises
 * once and is then just a cheap cached texture. The look is identical to
 * the static (frozen) desktop state; only the motion is dropped. Desktop
 * (≥lg) keeps the live pulsing flow. Revert: drop the `.wfg-root` mobile
 * block in globals.css.
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
      className="wfg-root fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Wave 1 — back, biggest, heavily blurred. Blur is static (18);
          only opacity pulses (compositor-cheap). */}
      <div className="absolute inset-0 wfg-wave wfg-wave-1">
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
              {/* Static blur — was animated 8↔28 (expensive per-frame
                  raster); frozen at the mid value for identical softness
                  at zero runtime cost. */}
              <feGaussianBlur stdDeviation="18" />
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
      <div className="absolute inset-0 wfg-wave wfg-wave-2">
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
      <div className="absolute inset-0 wfg-wave wfg-wave-3">
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

      {/* The shore — mobile only. The wave bands are drawn for a landscape
          box; stretched onto a portrait phone they exit the frame early and
          leave the bottom of the screen a flat, colorless strip — which is
          also what iOS Safari samples to tint its translucent URL bar. This
          continues the same diagonal palette (cyan → white → orange, left to
          right) to the true bottom edge, fading in vertically so it reads as
          the waves reaching the shore, not a new element. Desktop keeps the
          approved look untouched. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%] lg:hidden"
        style={{
          background:
            "linear-gradient(90deg, rgba(156,240,255,0.34) 0%, rgba(255,255,255,0.10) 48%, rgba(255,97,48,0.24) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 78%)",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 78%)",
        }}
      />
    </div>
  );
}
