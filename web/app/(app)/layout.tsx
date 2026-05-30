import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { TimezoneSync } from "@/app/components/TimezoneSync";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      {/* Bundle 4.2.49: syncs the device timezone into the viewer_tz
          cookie so server-rendered times display in the viewer's own
          zone (see lib/time/viewerTimeZone.ts). */}
      <TimezoneSync />
      <WaveFlowingBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
