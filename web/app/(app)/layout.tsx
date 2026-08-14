import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { TimezoneSync } from "@/app/components/TimezoneSync";
import { LegalFooter } from "@/app/components/LegalFooter";

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
      {/* Legal pack on every logged-in surface, the buyer page and
          checkout included. StickyJoinCTA hides itself near the page
          bottom, so this never collides with it. */}
      <div className="relative z-10 pb-6 pt-10">
        <LegalFooter />
      </div>
    </div>
  );
}
