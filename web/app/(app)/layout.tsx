export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      {/* Ambient depth — glow zones */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Cyan glow — top right (community energy) */}
        <div className="absolute -top-[150px] -right-[150px] w-[700px] h-[700px] rounded-full bg-[#9CF0FF] opacity-[0.12] blur-[180px]" />
        {/* Orange glow — bottom left (tribe energy) */}
        <div className="absolute bottom-[5%] -left-[200px] w-[600px] h-[600px] rounded-full bg-[#FF6130] opacity-[0.08] blur-[180px]" />
        {/* Deep teal pool — center */}
        <div className="absolute top-[40%] left-[30%] w-[600px] h-[600px] rounded-full bg-[#134E5E] opacity-[0.15] blur-[200px]" />
        {/* Subtle purple accent — mid-right */}
        <div className="absolute top-[60%] -right-[100px] w-[400px] h-[400px] rounded-full bg-[#4A2F8A] opacity-[0.06] blur-[150px]" />
      </div>

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
