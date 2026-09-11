"use client";

import { useEffect, useRef, useState } from "react";
import { WaitlistForm } from "./WaitlistForm";
import { CYAN, MUTED } from "./ui";

/**
 * The hero's quiet second door. A whisper line that, on click, extends into
 * the waitlist form right there — no jump, no leaving the moment.
 *
 * Also the target of the nav's "Join waitlist": it fires
 * `infitra:open-waitlist`, we expand the form and scroll it into view —
 * the visitor signs up HERE, with the whole story still ahead of them.
 */
export function HeroWaitlist() {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Open AND bring the form into view. The hero is a centered near-full-height
  // section, so on a phone a freshly-opened form lands under the browser's
  // bottom bar — every open path (the inline whisper here, the nav's
  // `infitra:open-waitlist`) must scroll it into view, or the input is cut off.
  const reveal = () => {
    setOpen(true);
    // let the form mount before scrolling to it
    window.setTimeout(() => {
      boxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  useEffect(() => {
    window.addEventListener("infitra:open-waitlist", reveal);
    return () => window.removeEventListener("infitra:open-waitlist", reveal);
  }, []);

  if (open) {
    return (
      <div ref={boxRef} id="waitlist" className="mt-12 w-full max-w-md text-left">
        <WaitlistForm />
      </div>
    );
  }

  return (
    <div ref={boxRef} id="waitlist">
      <button
        type="button"
        onClick={reveal}
        className="mt-12 text-[13.5px] sm:text-[14px] transition-opacity hover:opacity-70"
        style={{ color: MUTED }}
      >
        {/* each half is nowrap so the link never breaks mid-phrase (the arrow
           used to wrap onto its own line on phones) */}
        <span className="whitespace-nowrap">Here to train, not to build?</span>{" "}
        <span className="whitespace-nowrap" style={{ color: CYAN, fontWeight: 700 }}>Join the participant waitlist →</span>
      </button>
    </div>
  );
}
