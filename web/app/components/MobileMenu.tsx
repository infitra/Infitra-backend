"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileMenu({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 transition-colors"
        style={{ color: "rgba(15, 34, 41, 0.55)" }}
        aria-label="Menu"
      >
        {open ? (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 backdrop-blur-xl border-b py-3 px-6 space-y-1"
          style={{
            backgroundColor: "rgba(242, 239, 232, 0.95)",
            borderColor: "rgba(15, 34, 41, 0.10)",
          }}
        >
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block py-2.5 font-headline text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ color: "rgba(15, 34, 41, 0.55)" }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
