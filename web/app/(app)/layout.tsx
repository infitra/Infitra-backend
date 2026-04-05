import { DepthBackground } from "@/app/components/DepthBackground";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      <DepthBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
