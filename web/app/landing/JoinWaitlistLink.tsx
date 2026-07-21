"use client";

/**
 * Nav "Join waitlist" — opens the hero's collapsed waitlist form and brings
 * the visitor there. It used to jump past BOTH story chapters straight to
 * the finale; anyone tapping it skipped the whole narrative. The hero form
 * sits right below the fold, so the story stays ahead of them.
 */
export function JoinWaitlistLink() {
  return (
    <a
      href="#waitlist"
      onClick={(e) => {
        e.preventDefault();
        // HeroWaitlist listens for this: opens the form, then scrolls to it.
        window.dispatchEvent(new CustomEvent("infitra:open-waitlist"));
      }}
      className="px-3.5 sm:px-4 py-2 rounded-full text-xs font-headline font-bold uppercase tracking-widest whitespace-nowrap"
      style={{ color: "#0891b2", boxShadow: "inset 0 0 0 1.5px rgba(8,145,178,0.45)" }}
    >
      <span className="sm:hidden">Waitlist</span>
      <span className="hidden sm:inline">Join waitlist</span>
    </a>
  );
}
