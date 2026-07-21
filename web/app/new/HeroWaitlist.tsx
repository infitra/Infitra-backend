"use client";

import { useState } from "react";
import { WaitlistForm } from "./WaitlistForm";
import { CYAN, MUTED } from "./ui";

/**
 * The hero's quiet second door. A whisper line that, on click, extends into
 * the waitlist form right there — no jump, no leaving the moment.
 */
export function HeroWaitlist() {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="mt-7 w-full max-w-md text-left">
        <WaitlistForm />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-7 text-[12.5px] sm:text-[13px] transition-opacity hover:opacity-70"
      style={{ color: MUTED }}
    >
      {/* each half is nowrap so the link never breaks mid-phrase (the arrow
         used to wrap onto its own line on phones) */}
      <span className="whitespace-nowrap">Here to train, not to build?</span>{" "}
      <span className="whitespace-nowrap" style={{ color: CYAN, fontWeight: 700 }}>Join the participant waitlist →</span>
    </button>
  );
}
