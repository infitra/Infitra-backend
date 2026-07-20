"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The shared beat-chapter engine — the approved scroll system from the
 * collaborate chapter (rounds 14–17), extracted so both pinned chapters
 * ride the IDENTICAL feel.
 *
 * THE PACE CAR: the page scrolls 100% natively — nothing is ever prevented
 * or fought, so it always feels smooth. The stage renders from `beat`, not
 * from the scroll position, and the beat is driven by VELOCITY: a fresh
 * push (speed rising from rest, or accelerating mid-tail — momentum only
 * ever decays, so acceleration = a human) advances exactly one beat.
 * THE WALL: the position is clamped every frame to the current beat's
 * neighborhood, so no fling can physically overjump a boundary. When
 * motion settles, the position silently re-anchors under the sticky stage.
 * One system for trackpad, wheel, touch and keyboard.
 */

/* ── Shared visual timing + fit ladder ─────────────────────── */
export const CUT_MS = 260; // frame hard-cut duration
export const POP_MS = 340; // phase reveal duration
export const CASCADE_MS = 170; // cascading-items stagger
export const EASE = "cubic-bezier(.3,.7,.3,1)";
// Desktop-only short-viewport fit ladder. Gated to lg+ on purpose: below lg
// the pinned frames are fitted by <AutoFit> (measured, per-frame), and letting
// FIT's `scale` also apply there double-scaled the content unpredictably. On
// desktop AutoFit is inert, so FIT is the sole fit mechanism; below lg it is a
// no-op and AutoFit owns fitting.
export const FIT = "origin-center lg:[@media(max-height:900px)]:scale-[0.93] lg:[@media(max-height:820px)]:scale-[0.85] lg:[@media(max-height:730px)]:scale-[0.76]";

/* ── Feel constants (approved on deploy — tune here for BOTH chapters) ── */
const BEAT_VH = 70; // runway per beat unit
const PUSH_SPEED = 0.35; // px/ms — a deliberate swipe reads at/above this
const REARM_SPEED = 0.15; // px/ms — speed must fall below this before the next push counts
const ACCEL_REARM = 0.3; // px/ms jump frame-over-frame = a fresh human push mid-tail
const ACCEL_GRACE_MS = 250; // ignore acceleration re-arms this soon after a cut (same gesture's ramp)
const SETTLE_SPEED = 0.05; // px/ms — below this the reader has stopped
const SETTLE_MS = 140; // rest this long before the silent re-anchor
const STEP_GAP_MS = 320; // minimum time between beat cuts
const WALL_OVERHANG = 0.35; // beats of free travel beyond the current band before the wall
const OUTRO_FREE_ZONE = 0.12; // inside the last beat past this depth, position scrubs freely

export type BeatDef = { f: number; p: number; w: number };

export function computeBounds(beats: BeatDef[]): [number, number][] {
  const out: [number, number][] = [];
  let acc = 0;
  for (const b of beats) {
    out.push([acc, acc + b.w]);
    acc += b.w;
  }
  return out;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function useBeatChapter({
  beats,
  onTick,
}: {
  beats: BeatDef[];
  /** Per-frame extras (e.g. scrub-drawn artwork). Runs after the control logic. */
  onTick?: (pos: number, beat: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState(0);
  const [pinned, setPinned] = useState(true);
  const beatRef = useRef(0);
  const jumpGuardRef = useRef(false);
  const jumpTimerRef = useRef(0);

  const bounds = computeBounds(beats);
  const totalW = beats.reduce((a, b) => a + b.w, 0);

  const cfgRef = useRef({ beats, bounds, totalW });
  const onTickRef = useRef(onTick);
  useEffect(() => {
    cfgRef.current = { beats, bounds, totalW };
    onTickRef.current = onTick;
  });

  useEffect(() => {
    // Three modes, decided once on mount (matchMedia — not innerWidth — so
    // the real CSS viewport is read even in embedded/virtualized contexts):
    //  - static: reduced motion or very short viewports → sequential story.
    //  - scrub:  below lg → the chapter still PINS and steps beat by beat,
    //            but the beat follows scroll POSITION (quantized into the
    //            same bands) instead of policing gestures. Native touch
    //            momentum is never fought — no wall, no re-anchor, no
    //            arming. A slow swipe advances one beat; a fling may skip.
    //  - paced:  desktop → the full velocity pace-car below.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-height: 599px)").matches
    ) {
      // Microtask, not rAF — browsers throttle rAF in background and
      // virtualized contexts, and the swap to the static story must never
      // be missed on a phone that loaded in a background tab.
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) setPinned(false);
      });
      return () => {
        cancelled = true;
      };
    }

    if (window.matchMedia("(max-width: 1023px)").matches) {
      // SCRUB — position-quantized beats on a passive scroll listener.
      const onScroll = () => {
        const el = wrapperRef.current;
        if (!el) return;
        const { bounds: BOUNDS, totalW: TOTAL_W } = cfgRef.current;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        if (total <= 0) return;
        const pos = clamp01(-r.top / total) * TOTAL_W;
        // A jump (rail tap / join) owns the beat while its smooth scroll is
        // in flight — don't flicker through the bands it passes.
        if (jumpGuardRef.current) {
          onTickRef.current?.(pos, beatRef.current);
          return;
        }
        let fi = BOUNDS.length - 1;
        for (let i = 0; i < BOUNDS.length; i++) {
          if (pos >= BOUNDS[i][0] && pos < BOUNDS[i][1]) {
            fi = i;
            break;
          }
        }
        if (beatRef.current !== fi) {
          beatRef.current = fi;
          setBeat(fi);
        }
        onTickRef.current?.(pos, fi);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }
    let raf = 0;
    let prevY = window.scrollY;
    let prevT = performance.now();
    let lastInstAbs = 0;
    let vel = 0; // EMA, px/ms, signed
    let armed = false;
    let settledSince = 0;
    let lastStepT = 0;
    let prevCovering = false;

    const step = (next: number, now: number) => {
      lastStepT = now;
      armed = false;
      beatRef.current = next;
      setBeat(next);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const el = wrapperRef.current;
      if (!el) return;
      const { beats: BEATS, bounds: BOUNDS, totalW: TOTAL_W } = cfgRef.current;
      const y = window.scrollY;
      const dt = Math.max(1, now - prevT);
      const inst = (y - prevY) / dt;
      prevY = y;
      prevT = now;
      vel = vel * 0.65 + inst * 0.35;
      const speed = Math.abs(vel);
      const instAbs = Math.abs(inst);
      // momentum only decays — a genuine frame-over-frame acceleration is a
      // human push. It must clearly beat the current speed (fast flings are
      // noisy) and can't be the same gesture's own ramp right after a cut.
      if (
        instAbs > lastInstAbs + ACCEL_REARM &&
        instAbs > speed * 1.5 + 0.2 &&
        now - lastStepT > ACCEL_GRACE_MS
      ) {
        armed = true;
      }
      lastInstAbs = instAbs;

      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 2 || r.bottom < -window.innerHeight) return; // far away — idle
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const pos = clamp01(-r.top / total) * TOTAL_W;
      const covering = r.top <= 2 && r.bottom >= window.innerHeight - 2;
      const entered = covering && !prevCovering;
      prevCovering = covering;
      const last = BEATS.length - 1;
      const b = beatRef.current;

      if (!covering) {
        // outside the pin the beat follows position directly
        let fi = last;
        for (let i = 0; i < BOUNDS.length; i++) {
          if (pos >= BOUNDS[i][0] && pos < BOUNDS[i][1]) {
            fi = i;
            break;
          }
        }
        if (b !== fi) {
          beatRef.current = fi;
          setBeat(fi);
        }
      } else if (!jumpGuardRef.current) {
        if (entered && pos < TOTAL_W / 2) {
          // HARD CUT on entry from above: whatever momentum carried the
          // reader in, the chapter opens on its title — the fling is one
          // continuous motion and grants no steps until they push again.
          if (b !== 0) {
            beatRef.current = 0;
            setBeat(0);
          }
          armed = false;
          settledSince = 0;
        } else {
          if (speed < REARM_SPEED) armed = true;
          if (armed && speed >= PUSH_SPEED && now - lastStepT >= STEP_GAP_MS) {
            const dir = vel > 0 ? 1 : -1;
            // the last beat is a free scrub zone — no step-back until the
            // reader has scrubbed to its very top edge
            const blocked = b === last && dir < 0 && pos > BOUNDS[last][0] + OUTRO_FREE_ZONE;
            const next = Math.min(last, Math.max(0, b + dir));
            if (!blocked && next !== b) step(next, now);
          }
          // THE WALL: the page can never physically leave the current
          // beat's neighborhood — however hard the fling, the excess
          // momentum dies here (invisible under the sticky stage; a push
          // moves the beat, and the wall opens by exactly one band).
          // Beat 0 stays open upward and the last beat downward — the
          // chapter's two natural exits.
          {
            const bw = beatRef.current;
            const lo =
              bw === 0 ? -Infinity : bw === last ? BOUNDS[last][0] - 0.3 : BOUNDS[bw][0] - WALL_OVERHANG;
            const hi = bw === last ? Infinity : BOUNDS[bw][1] + WALL_OVERHANG;
            if (pos < lo || pos > hi) {
              const held = Math.min(Math.max(pos, lo), hi);
              // "instant", NOT "auto": the page CSS sets scroll-behavior:
              // smooth, and "auto" defers to it — the correction would
              // become an animated scroll the pace car reads as a push
              window.scrollTo({ top: y + r.top + (held / TOTAL_W) * total, behavior: "instant" });
              prevY = window.scrollY; // this frame already measured the attempted motion
            }
          }
          // silent re-anchor once the reader rests — invisible under the
          // sticky stage, keeps position and story aligned
          if (speed < SETTLE_SPEED) {
            if (!settledSince) settledSince = now;
          } else {
            settledSince = 0;
          }
          if (settledSince && now - settledSince >= SETTLE_MS) {
            const bNow = beatRef.current;
            const anchor =
              bNow === last ? BOUNDS[last][0] + 0.05 : (BOUNDS[bNow][0] + BOUNDS[bNow][1]) / 2;
            const wantsAnchor = bNow !== last || pos < BOUNDS[last][0] + 0.02;
            const targetY = y + r.top + (anchor / TOTAL_W) * total;
            if (wantsAnchor && Math.abs(targetY - y) > 24) {
              window.scrollTo({ top: targetY, behavior: "instant" });
              prevY = window.scrollY; // the correction is not motion
              vel = 0;
              lastInstAbs = 0;
            }
            settledSince = 0;
          }
        }
      }

      onTickRef.current?.(pos, beatRef.current);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Scroll the page to a beat's midpoint — scroll stays the source of truth. */
  function jumpToBeat(i: number) {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const mid = (bounds[i][0] + bounds[i][1]) / 2;
    jumpGuardRef.current = true;
    window.clearTimeout(jumpTimerRef.current);
    jumpTimerRef.current = window.setTimeout(() => {
      jumpGuardRef.current = false;
    }, 1100);
    beatRef.current = i;
    setBeat(i);
    window.scrollTo({ top: window.scrollY + r.top + (mid / totalW) * total, behavior: "smooth" });
  }

  return { beat, pinned, wrapperRef, jumpToBeat, bounds, totalW, runwayVh: totalW * BEAT_VH };
}

/* ── AutoFit — mobile frame scaler ───────────────────────────
 * Below lg the pinned frames keep their desktop compositions but must fit
 * a phone-height stage: measure the content against the available box and
 * scale down (floored — legibility beats completeness; the floor only
 * matters on the very tallest beats). Desktop is untouched: the effect
 * never activates, scale stays 1, and the wrapper is layout-neutral. */
export function AutoFit({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const measure = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      const avail = outer.clientHeight;
      const need = inner.scrollHeight;
      if (avail > 0 && need > 0) {
        // Fit to 94% of the box, not 100% — tall frames kept sitting edge-to-
        // edge (and the tallest clipped at the old 0.68 floor). The 6% keeps a
        // little breathing room top and bottom; the lower floor lets the very
        // tallest frames shrink to fit rather than clip on short phones.
        setScale(Math.max(0.5, Math.min(1, (avail * 0.94) / need)));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} className="w-full flex-1 min-h-0 flex items-center justify-center">
      <div
        ref={innerRef}
        className="w-full"
        style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: "center" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

/* ── One phase of a pinned frame ─────────────────────────────
 * Pinned: absolutely stacked inside the frame's minHeight box, hard-cut
 * transitions. Static (mobile / fallback story): only the active phase
 * renders, in normal flow — no absolute stack, no reserved height. */
export function Phase({
  on,
  isStatic = false,
  className = "",
  enterFrom = "translateY(14px)",
  interactive = false,
  children,
}: {
  on: boolean;
  isStatic?: boolean;
  className?: string;
  enterFrom?: string;
  interactive?: boolean;
  children: React.ReactNode;
}) {
  if (isStatic) {
    return on ? <div className={className}>{children}</div> : null;
  }
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : enterFrom,
        transition: `opacity ${CUT_MS}ms ${EASE} ${on ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${on ? 80 : 0}ms`,
        pointerEvents: interactive && on ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

/* ── Mount reveal — for keyed swaps (mobile stagings) ────────
 * Pop animates on a `show` flip; Enter animates on MOUNT. The mobile
 * stagings render one hero per beat and remount it (key={phase}), so the
 * entry needs no external trigger. Same timing language as Pop. */
export function Enter({
  d = 0,
  from = "translateY(14px) scale(0.98)",
  className,
  children,
}: {
  d?: number;
  from?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 30);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : from,
        transition: `opacity ${POP_MS}ms ${EASE} ${d}ms, transform ${POP_MS}ms ${EASE} ${d}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Phase reveal — space reserved, pops decisively ────────── */
export function Pop({
  show,
  d = 0,
  from = "translateY(14px) scale(0.97)",
  className,
  children,
}: {
  show: boolean;
  d?: number;
  from?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "none" : from,
        transition: `opacity ${POP_MS}ms ${EASE} ${d}ms, transform ${POP_MS}ms ${EASE} ${d}ms`,
        pointerEvents: show ? undefined : "none",
      }}
    >
      {children}
    </div>
  );
}
