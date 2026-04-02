"use client";

import { useState } from "react";

interface MasterAccordionProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function MasterAccordion({ title, subtitle, children }: MasterAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#9CF0FF]/10 rounded-2xl overflow-hidden bg-[#0A1A1F]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-8 md:px-10 py-8 text-left group"
      >
        <div>
          <span className="text-xl md:text-2xl font-black text-white font-headline tracking-tight group-hover:text-[#9CF0FF] transition-colors block">
            {title}
          </span>
          <span className="text-sm text-[#9CF0FF]/35 mt-1 block">
            {subtitle}
          </span>
        </div>
        <span
          className="flex-shrink-0 ml-6 w-9 h-9 rounded-full border border-[#9CF0FF]/30 flex items-center justify-center transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <svg width="14" height="14" fill="none" stroke="#9CF0FF" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <div
        className="transition-all duration-500 ease-in-out overflow-hidden"
        style={{ maxHeight: open ? "8000px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-8 md:px-10 pb-10 border-t border-[#9CF0FF]/8">
          <div className="pt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
