"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
}

/**
 * Tabs — client-side tab switcher. No page reload.
 * Renders the active tab's content via render prop.
 */
export function Tabs({ tabs, defaultTab, children }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-headline transition-none ${
              active === tab.id
                ? "bg-white text-[#0F2229]"
                : "text-[#94a3b8] hover:text-[#0F2229]"
            }`}
            style={
              active === tab.id
                ? {
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                  }
                : undefined
            }
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-[10px] opacity-50">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {children(active)}
    </div>
  );
}
