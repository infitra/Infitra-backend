import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
