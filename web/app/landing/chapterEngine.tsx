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
const SCRUB_SETTLE_MS = 160; // scroll silence before the mobile settle acts
const DRAG_STEP_PX = 130; // finger travel that advances one beat while dragging
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
  beatVh = BEAT_VH,
}: {
  beats: BeatDef[];
  /** Per-frame extras (e.g. scrub-drawn artwork). Runs after the control logic. */
  onTick?: (pos: number, beat: number) => void;
  /** Runway height per beat unit, in vh. Mobile passes a shorter value so the
   *  pinned stage carries less dead scroll between cuts. Defaults to BEAT_VH. */
  beatVh?: number;
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
    //  - scrub:  below lg → the chapter still PINS and steps beat by beat.
    //            The beat advances on the GESTURE (one step per swipe, by
    //            finger travel), never on scroll position or momentum;
    //            position free-runs natively and silently re-anchors to the
    //            story once motion stops. No swipe can skip a beat.
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
      // SCRUB — the mobile chapter mode, passive listeners only.
      // The viewport height is captured ONCE and only refreshed on real
      // viewport changes (rotation / width change) — never for the mobile
      // URL-bar collapse, which changes innerHeight by ~60-100px mid-scroll
      // and would shift every beat boundary under the reader's thumb.
      //
      // GESTURE-STEPPED (v4). Position-quantized beats felt broken on real
      // phones: the cut fired only after half a band of dead travel (read
      // as "0.5-1s of lag"), and the same swipe's momentum tail then
      // crossed the NEXT boundary too (skipped beats). Root CSS snap before
      // that was worse (page-wide heavy physics; every stray snap-align
      // became a vertical trap). So while pinned, the story no longer
      // follows the scroll position at all: the BEAT advances on the
      // gesture itself — one step per swipe, firing once the swipe's
      // travel (finger contact plus its early momentum) passes
      // DRAG_STEP_PX — while the scroll position free-runs natively,
      // never fought. Beyond that single step, momentum can carry the
      // position anywhere; it can never advance the story. Once motion
      // fully stops
      // (SCRUB_SETTLE_MS of silence, finger up), the position silently
      // re-anchors to the current beat's band under the pinned stage —
      // invisible, the mobile analogue of the desktop wall, applied only
      // at rest.
      let touchActive = false;
      let sawTouch = false;
      let settleT = 0;
      let lastY = window.scrollY;
      let lastDir = 0;
      let accum = 0; // swipe travel (contact + early momentum) toward the next step
      let steppedSinceTouch = false; // latch: momentum may fire at most ONE step per gesture
      let armed = false; // trackpad path: one step per distinct gesture
      let velPrevY = window.scrollY;
      let velPrevT = performance.now();
      let lastStepT = 0;
      let prevCovering = false;
      // ── ?debugscroll HUD — a tiny live readout of the gesture engine's
      // internals, for diagnosing real-device behavior the pane can't
      // simulate. Renders ONLY with the flag in the URL; ships inert. ──
      const dbg = /debugscroll/.test(location.search + location.hash)
        ? (() => {
            let host = document.getElementById("scrub-debug");
            if (!host) {
              host = document.createElement("div");
              host.id = "scrub-debug";
              host.style.cssText =
                "position:fixed;left:4px;bottom:4px;z-index:99999;background:rgba(0,0,0,0.82);color:#7CFC9A;font:10px/1.5 monospace;padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre;max-width:96vw";
              document.body.appendChild(host);
            }
            const line = document.createElement("div");
            host.appendChild(line);
            const c = { ent: 0, ts: 0, te: 0, stp: 0, blk: 0, set: 0, rst: 0, accPk: 0, maxDy: 0 };
            return {
              c,
              line,
              paint(extra: string) {
                line.textContent = `[${cfgRef.current.totalW}] ${extra} | ent${c.ent} ts${c.ts} te${c.te} stp${c.stp} blk${c.blk} set${c.set} rst${c.rst} pk${Math.round(c.accPk)} mx${Math.round(c.maxDy)}`;
              },
            };
          })()
        : null;
      const stepBeat = (dir: 1 | -1, now: number): boolean => {
        const { bounds: BOUNDS } = cfgRef.current;
        const last = BOUNDS.length - 1;
        const b = beatRef.current;
        if (dir > 0 && b >= last) return false; // the outro exits downward freely
        if (dir < 0 && b <= 0) return false; // the intro exits upward freely
        if (now - lastStepT < STEP_GAP_MS) return false; // one cut per gap
        lastStepT = now;
        beatRef.current = b + dir;
        setBeat(b + dir);
        return true;
      };
      const trySettle = () => {
        if (touchActive || jumpGuardRef.current) return;
        const el = wrapperRef.current;
        if (!el) return;
        const { bounds: BOUNDS, totalW: TOTAL_W } = cfgRef.current;
        const r = el.getBoundingClientRect();
        const total = r.height - vh;
        if (total <= 0) return;
        if (!(r.top <= 2 && r.bottom >= vh - 2)) return; // only under the pin
        const b = beatRef.current;
        const last = BOUNDS.length - 1;
        if (b >= last) return; // the outro is a free scrub zone
        if (b === 0 && lastDir < 0) return; // leaving upward — don't pull back
        const anchor = (BOUNDS[b][0] + BOUNDS[b][1]) / 2;
        const targetY = window.scrollY + r.top + (anchor / TOTAL_W) * total;
        // "instant", not smooth: invisible under the sticky stage, and a
        // smooth correction would read as new motion.
        if (Math.abs(targetY - window.scrollY) > 8) {
          window.scrollTo({ top: targetY, behavior: "instant" });
          // the correction is not motion — reset every motion tracker
          lastY = window.scrollY;
          velPrevY = window.scrollY;
          armed = false;
          if (dbg) dbg.c.set++;
        }
      };
      const armSettle = () => {
        window.clearTimeout(settleT);
        settleT = window.setTimeout(trySettle, SCRUB_SETTLE_MS);
      };
      const onTouchStart = () => {
        touchActive = true;
        sawTouch = true;
        accum = 0;
        steppedSinceTouch = false; // a new physical gesture may step again
        window.clearTimeout(settleT);
        if (dbg) dbg.c.ts++;
      };
      const onTouchEnd = () => {
        touchActive = false;
        armSettle();
        if (dbg) dbg.c.te++;
      };
      let vw = window.innerWidth;
      let vh = window.innerHeight;
      const onResize = () => {
        if (window.innerWidth !== vw || Math.abs(window.innerHeight - vh) > 150) {
          vw = window.innerWidth;
          vh = window.innerHeight;
        }
        onScroll();
      };
      const onScroll = () => {
        const now = performance.now();
        const yNow = window.scrollY;
        const dy = yNow - lastY;
        if (dy !== 0) {
          lastDir = dy > 0 ? 1 : -1;
          lastY = yNow;
        }
        armSettle(); // every scroll event defers the settle — it acts only at rest
        const el = wrapperRef.current;
        if (!el) return;
        const { bounds: BOUNDS, totalW: TOTAL_W } = cfgRef.current;
        const r = el.getBoundingClientRect();
        const total = r.height - vh;
        if (total <= 0) return;
        const pos = clamp01(-r.top / total) * TOTAL_W;
        const covering = r.top <= 2 && r.bottom >= vh - 2;
        // HYSTERESIS on the entry edge: `entered` must never re-fire from a
        // one-event covering flicker (iOS URL-bar collapse and sub-pixel
        // rect jitter can wobble r.top around the threshold mid-swipe, and
        // a spurious `entered` re-cuts to the door AND spends the gesture —
        // the reader gets pinned to the intro). prevCovering only drops
        // once the wrapper is CLEARLY outside the pin.
        const entered = covering && !prevCovering;
        if (covering) prevCovering = true;
        else if (r.top > 40 || r.bottom < vh - 40) prevCovering = false;
        if (dbg) {
          dbg.c.maxDy = Math.max(dbg.c.maxDy, Math.abs(dy));
          dbg.paint(
            `cov${covering ? 1 : 0} b${beatRef.current} pos${pos.toFixed(1)} acc${Math.round(accum)} dy${Math.round(dy)} vh${vh}/${window.innerHeight} ${touchActive ? "T" : "."}${sawTouch ? "S" : "."}${steppedSinceTouch ? "L" : "."}`
          );
        }
        // A jump (rail tap / join) owns the beat while its smooth scroll is
        // in flight — don't flicker through the bands it passes.
        if (jumpGuardRef.current) {
          onTickRef.current?.(pos, beatRef.current);
          return;
        }
        if (!covering) {
          // outside the pin the beat follows position directly — the frames
          // entering/leaving the viewport stay in sync with the page
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
          accum = 0;
          onTickRef.current?.(pos, fi);
          return;
        }
        if (entered) {
          // the entering motion grants no step: the chapter opens on its
          // door (intro from above, outro from below), same as the desktop
          // hard cut — the fling that carried the reader in is spent
          const door = pos < TOTAL_W / 2 ? 0 : BOUNDS.length - 1;
          if (beatRef.current !== door) {
            beatRef.current = door;
            setBeat(door);
          }
          accum = 0;
          armed = false;
          steppedSinceTouch = true; // the entering gesture is spent
          velPrevY = yNow;
          velPrevT = now;
          if (dbg) dbg.c.ent++;
          onTickRef.current?.(pos, beatRef.current);
          return;
        }
        if (sawTouch) {
          // TOUCH DEVICES — the step signal is the SWIPE's travel, counted
          // from touchstart THROUGH its early momentum. A real flick keeps
          // the finger on glass for only ~40-100px; the distance arrives
          // after finger-up, so counting contact travel alone starved the
          // step entirely (the "can't get past the intro" regression).
          // One flick = one cut: with the finger up, the momentum may fire
          // a step only if this gesture hasn't stepped yet — the rest of
          // the tail moves nothing. A long finger-down drag may still step
          // repeatedly (deliberate scrubbing, STEP_GAP-paced).
          // direction flip resets the count — but only a REAL flip (>4px):
          // iOS scroll positions jitter by fractions mid-swipe (URL-bar
          // animation, sub-pixel adjustments) and a 1px counter-blip must
          // not zero a nearly-complete swipe.
          if (Math.abs(dy) > 4 && accum !== 0 && Math.sign(dy) !== Math.sign(accum)) {
            accum = 0;
            if (dbg) dbg.c.rst++;
          }
          accum += dy;
          if (dbg) dbg.c.accPk = Math.max(dbg.c.accPk, Math.abs(accum));
          if (Math.abs(accum) >= DRAG_STEP_PX) {
            if (touchActive || !steppedSinceTouch) {
              if (stepBeat(accum > 0 ? 1 : -1, now)) {
                steppedSinceTouch = true;
                accum = 0;
                if (dbg) dbg.c.stp++;
              } else if (dbg) dbg.c.blk++;
            } else if (dbg) dbg.c.blk++;
          }
        } else {
          // no touch on this device (trackpad/wheel below lg): the desktop
          // arm/push idea, event-driven — one step per distinct gesture
          const dt = Math.max(1, now - velPrevT);
          const speed = Math.abs(yNow - velPrevY) / dt;
          if (speed < REARM_SPEED) armed = true;
          else if (armed && speed >= PUSH_SPEED) {
            stepBeat(yNow > velPrevY ? 1 : -1, now);
            armed = false;
          }
        }
        velPrevY = yNow;
        velPrevT = now;
        onTickRef.current?.(pos, beatRef.current);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
        window.clearTimeout(settleT);
        dbg?.line.remove();
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

  return { beat, pinned, wrapperRef, jumpToBeat, bounds, totalW, runwayVh: totalW * beatVh };
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
        // Quantized to 0.01 and dead-banded: sub-2% deltas (measurement noise,
        // tiny box shifts) must never re-scale the stage mid-read.
        const next = Math.round(Math.max(0.5, Math.min(1, (avail * 0.96) / need)) * 100) / 100;
        setScale((prev) => (Math.abs(next - prev) < 0.02 ? prev : next));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    // The bottom padding BIASES the vertical centering upward: pure centering
    // left short content sitting too deep below the anchored title (a dead
    // band between title and content, all leftover at eye level). Content now
    // gravitates toward the title; spare room pools at the bottom. Desktop
    // bias is moderate — 11vh starved the TALLEST frames' budget and pushed
    // them up over the anchored copy (AutoFit is inert on lg, so an oversize
    // frame centers and bleeds BOTH ways).
    <div ref={outerRef} className="w-full flex-1 min-h-0 flex items-center justify-center pb-[5vh] lg:pb-[6vh]">
      <div
        ref={innerRef}
        className="w-full"
        style={
          scale < 1
            ? { transform: `scale(${scale})`, transformOrigin: "center", transition: `transform 200ms ${EASE}` }
            : { transition: `transform 200ms ${EASE}` }
        }
      >
        {children}
      </div>
    </div>
  );
}

/* ── useTap — reliable taps on in-story CTAs ─────────────────
 * On iOS, tapping while the page still has swipe momentum consumes the
 * first tap to STOP the scroll and suppresses the click — the story CTAs
 * (Publish, Join) felt like they needed two taps. Fire on pointerup
 * instead: it survives the scroll-stop tap. A movement guard ignores
 * swipes that merely end on the button, and a debounce swallows the
 * duplicate click event when both do fire. */
export function useTap(fn: () => void) {
  const downY = useRef<number | null>(null);
  const lastFire = useRef(0);
  const fire = () => {
    const now = Date.now();
    if (now - lastFire.current < 600) return;
    lastFire.current = now;
    fn();
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      downY.current = e.clientY;
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") return; // mouse/pen use plain click
      if (downY.current !== null && Math.abs(e.clientY - downY.current) > 12) return;
      fire();
    },
    onClick: fire,
  };
}

/* ── MobileRail — the story scaffolding below lg ─────────────
 * The phone's answer to the desktop rail: a persistent strip under the
 * fixed nav showing WHERE in the story the reader is — current step
 * number + label, and one segment per step (past filled, current filling
 * with beat progress, future faint). Segments are tappable jumps. Hidden
 * on intro/outro frames, same as the desktop rail. */
export function MobileRail({
  steps,
  frame,
  progress,
  light,
  onStep,
}: {
  steps: { n: string; label: string; frame: number }[];
  frame: number;
  /** 0..1 — fill of the CURRENT step's segment (beat position inside the step). */
  progress: number;
  /** true on dark stages (light text/segments). */
  light: boolean;
  onStep: (frame: number) => void;
}) {
  const active = steps.find((s) => s.frame === frame);
  const on = !!active;
  const ink = light ? "#F6F3EC" : "#0F2229";
  const faint = light ? "rgba(246,243,236,0.45)" : "rgba(15,34,41,0.40)";
  const track = light ? "rgba(246,243,236,0.22)" : "rgba(15,34,41,0.14)";
  const ORANGE = "#FF6130";
  return (
    <div
      className="lg:hidden absolute top-20 inset-x-6 z-20"
      style={{ opacity: on ? 1 : 0, pointerEvents: on ? "auto" : "none", transition: `opacity 400ms ease, color 400ms ease` }}
    >
      <div className="flex items-baseline justify-center gap-2.5 mb-3">
        <span className="text-[12px] uppercase tracking-[0.22em] font-headline tabular-nums" style={{ color: ORANGE, fontWeight: 800 }}>
          {active?.n ?? ""}
        </span>
        <span className="text-[13.5px] uppercase tracking-[0.18em] font-headline" style={{ color: ink, fontWeight: 800, transition: "color 400ms ease" }}>
          {active?.label ?? ""}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: faint, fontWeight: 700, transition: "color 400ms ease" }}>
          / {String(steps.length).padStart(2, "0")}
        </span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((s) => {
          const past = s.frame < frame;
          const cur = s.frame === frame;
          return (
            <button
              key={s.frame}
              type="button"
              aria-label={s.label}
              onClick={() => onStep(s.frame)}
              className="flex-1 py-1.5 -my-1.5"
            >
              <span className="block h-1 rounded-full overflow-hidden" style={{ backgroundColor: track, transition: "background-color 400ms ease" }}>
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: past ? "100%" : cur ? `${Math.round(clamp01(progress) * 100)}%` : "0%",
                    backgroundColor: ORANGE,
                    boxShadow: cur ? "0 0 8px rgba(255,97,48,0.5)" : undefined,
                    // Both chapters feed count-based STEPPED progress (one
                    // notch per beat cut) — a quick linear fill per notch.
                    // Live position-driven fill was tried and jittered against
                    // the settle's invisible re-anchors.
                    transition: `width 140ms linear`,
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── TitleZone — the anchored head of every railed frame ─────
 * The kickers used to repeat what the rail says; now the rail carries the
 * step identity and this zone carries ONLY the title + copy — at a FIXED
 * height on every frame (desktop and mobile), directly under the rail.
 * A swipe crossfades the words in place; the reader never re-orients.
 * Content below distributes in the remaining space. */
export function TitleZone({
  k,
  title,
  copy,
  light,
}: {
  /** crossfade key — change it to swap the words */
  k: string | number;
  title: React.ReactNode;
  copy?: React.ReactNode;
  /** light text on dark stages */
  light: boolean;
}) {
  return (
    <div className="relative w-full shrink-0 text-center min-h-[9.5rem] md:min-h-[12rem]">
      <Enter key={k} from="none" className="absolute inset-x-0 top-0">
        <h3
          className="text-[1.85rem] leading-[1.15] md:text-[2.8rem] md:leading-[1.1] font-headline tracking-tight mb-3.5 max-w-3xl mx-auto"
          style={{ color: light ? "#F6F3EC" : "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {title}
        </h3>
        {copy && (
          <p
            className="text-[15px] md:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: light ? "rgba(244,241,232,0.72)" : "#475569" }}
          >
            {copy}
          </p>
        )}
      </Enter>
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
        // inherit (undefined), never explicit "auto": pointer-events is
        // inherited, and an explicit auto would re-enable hit-testing even
        // under an INACTIVE frame container's pointer-events:none — the
        // invisible Phase would swallow clicks meant for the visible frame.
        pointerEvents: interactive && on ? undefined : "none",
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
  // translate + fade only — NO scale: a per-swipe zoom (however subtle)
  // compounds with any AutoFit scaling into a visible "breathing" wobble.
  from = "translateY(12px)",
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
