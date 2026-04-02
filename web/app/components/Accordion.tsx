"use client";

import { useState } from "react";

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-[#9CF0FF]/10 rounded-2xl overflow-hidden bg-[#0F2229]"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-8 py-6 text-left group"
          >
            <span className="text-lg font-bold text-white font-headline tracking-wide group-hover:text-[#9CF0FF] transition-colors">
              {item.title}
            </span>
            <span
              className="flex-shrink-0 ml-4 w-7 h-7 rounded-full border border-[#9CF0FF]/30 flex items-center justify-center transition-transform duration-300"
              style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}
            >
              <svg width="12" height="12" fill="none" stroke="#9CF0FF" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </span>
          </button>

          <div
            className="transition-all duration-300 ease-in-out overflow-hidden"
            style={{ maxHeight: open === i ? "1000px" : "0px", opacity: open === i ? 1 : 0 }}
          >
            <div className="px-8 pb-8 text-[#9CF0FF]/60 text-sm leading-relaxed border-t border-[#9CF0FF]/8">
              <div className="pt-6">{item.content}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
