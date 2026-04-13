"use client";

import { Tabs } from "@/app/components/Tabs";

interface DashboardTabsProps {
  communityContent: React.ReactNode;
  tribesContent: React.ReactNode;
  tribeCount: number;
  memberCount: number;
}

/**
 * DashboardTabs — switches between Community and Tribes on the creator dashboard.
 * Both contents are pre-rendered by the server and passed as children.
 */
export function DashboardTabs({
  communityContent,
  tribesContent,
  tribeCount,
  memberCount,
}: DashboardTabsProps) {
  const tabs = [
    { id: "community", label: "Community", count: memberCount },
    { id: "tribes", label: "Tribes", count: tribeCount },
  ];

  return (
    <Tabs tabs={tabs} defaultTab="community">
      {(activeTab) => (
        <div>
          {activeTab === "community" && communityContent}
          {activeTab === "tribes" && tribesContent}
        </div>
      )}
    </Tabs>
  );
}
