import { MUTED } from "../ui";

/**
 * The lead-in to the showcase (11 Sep 2026). It sits close to the showcase's
 * own header ("An example experience, built on INFITRA.") and far from the
 * winners above, and it says the one thing the example must not imply: this
 * is one of the two shapes, not the blueprint for everything.
 */
export function Bridge() {
  return (
    <div id="bridge" className="px-6 pt-20 md:pt-28 pb-0">
      <p className="max-w-2xl mx-auto text-center text-base md:text-lg leading-relaxed" style={{ color: MUTED }}>
        One of the two shapes, shown start to finish: two experts, six weeks,
        one tribe. A studio and an outside expert run the same way, for the
        studio&apos;s members.
      </p>
    </div>
  );
}
