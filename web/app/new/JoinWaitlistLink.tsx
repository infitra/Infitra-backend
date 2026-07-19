"use client";

/**
 * Nav "Join waitlist" — jumps to the finale with behavior:"instant".
 *
 * A plain #join anchor animates (the page sets scroll-behavior: smooth) and
 * the animation passes THROUGH the pinned chapters — their pace-car wall
 * intercepts the motion mid-flight and cancels the jump. One instant jump
 * lands past both runways in a single frame; the engines idle on far-away
 * wrappers and never see it.
 */
export function JoinWaitlistLink() {
  return (
    <a
      href="#join"
      onClick={(e) => {
        const el = document.getElementById("join");
        if (!el) return; // fall back to the anchor
        e.preventDefault();
        window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top, behavior: "instant" });
        history.replaceState(null, "", "#join");
      }}
      className="px-3.5 sm:px-4 py-2 rounded-full text-xs font-headline font-bold uppercase tracking-widest whitespace-nowrap"
      style={{ color: "#0891b2", boxShadow: "inset 0 0 0 1.5px rgba(8,145,178,0.45)" }}
    >
      <span className="sm:hidden">Waitlist</span>
      <span className="hidden sm:inline">Join waitlist</span>
    </a>
  );
}
