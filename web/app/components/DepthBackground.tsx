"use client";

/**
 * DepthBackground — bottom-line beam, atmospheric depth.
 *
 * The composition has ONE focal element: a sharp, vivid cyan line at the
 * very bottom of the viewport, with a strong outward beam glow. Above the
 * line, a soft cyan afterglow fades upward into darkness. Behind everything,
 * two blurred warm-orange corner blooms add color depth without competing.
 * A running hot spot travels along the line for subtle dynamics.
 *
 * Composition order (back → front, all behind content at z-0):
 *   1. Top atmospheric darkness (deepens the upper viewport)
 *   2. Warm corner glows (ambient depth, very blurred)
 *   3. Cyan afterglow above the line (the soft fade-off)
 *   4. THE LINE — sharp cyan strip, full width, strong glow
 *   5. Running light (a hot spot moving along the line)
 */
export function DepthBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* ── Layer 1: Top atmospheric darkness ─────────────────────
          Deepens the upper viewport so the bottom hero feels dramatic. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.20) 22%, transparent 45%)",
        }}
      />

      {/* ── Layer 2: Cyan afterglow ───────────────────────────────
          A soft cyan upward fade emerging from the line — the line
          bleeds light upward into the surrounding atmosphere. */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "42vh",
          background:
            "linear-gradient(to top, rgba(156,240,255,0.45) 0%, rgba(156,240,255,0.18) 14%, rgba(156,240,255,0.06) 32%, transparent 60%)",
          filter: "blur(14px)",
        }}
      />

      {/* ── Layer 4: THE BEAM LINE ────────────────────────────────
          The hero element. A sharp, vivid cyan strip running the full
          width of the viewport. Lifted 2px off the bottom edge so its
          downward glow is visible too. Stacked box-shadows give it a
          tight bright halo and a wide soft bloom — beam of light. */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: "2px",
          height: "3px",
          background:
            "linear-gradient(to right, transparent 0%, rgba(156,240,255,0.85) 4%, #9CF0FF 16%, #FFFFFF 45%, #FFFFFF 55%, #9CF0FF 84%, rgba(156,240,255,0.85) 96%, transparent 100%)",
          boxShadow: [
            "0 0 4px #FFFFFF",
            "0 0 12px #9CF0FF",
            "0 0 32px #9CF0FF",
            "0 0 70px rgba(156,240,255,0.9)",
            "0 0 140px rgba(156,240,255,0.55)",
            "0 -8px 50px rgba(156,240,255,0.65)",
          ].join(", "),
          animation: "line-breath 5s ease-in-out infinite",
        }}
      />

      {/* ── Layer 5: Running light ────────────────────────────────
          A bright hot spot that travels along the line from left to
          right. Subtle "energy moving through the light source" cue.
          Long cycle so it's an occasional accent, not a distraction. */}
      <div
        className="absolute bottom-0"
        style={{
          width: "160px",
          height: "8px",
          marginLeft: "-80px",
          background:
            "radial-gradient(ellipse at center, #FFFFFF 0%, #9CF0FF 35%, rgba(156,240,255,0.45) 65%, transparent 100%)",
          filter: "blur(7px)",
          boxShadow:
            "0 0 28px #FFFFFF, 0 0 60px #9CF0FF, 0 0 130px rgba(156,240,255,0.7)",
          opacity: 0,
          animation: "running-light 14s linear infinite",
        }}
      />
    </div>
  );
}
