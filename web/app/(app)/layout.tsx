export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030B10] relative overflow-hidden">
      {/* Ambient depth — radiant glow zones with bright centers */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Cyan glow — top right (bright center + soft spread) */}
        <div className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full bg-[#9CF0FF] opacity-[0.25] blur-[60px]" />
        <div className="absolute -top-[120px] -right-[120px] w-[500px] h-[500px] rounded-full bg-[#9CF0FF] opacity-[0.06] blur-[120px]" />

        {/* Orange glow — bottom left (bright center + soft spread) */}
        <div className="absolute bottom-[80px] -left-[40px] w-[180px] h-[180px] rounded-full bg-[#FF6130] opacity-[0.2] blur-[50px]" />
        <div className="absolute bottom-[0px] -left-[120px] w-[450px] h-[450px] rounded-full bg-[#FF6130] opacity-[0.04] blur-[120px]" />

        {/* Deep blue pool — center, creates depth between the two */}
        <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] rounded-full bg-[#0A1E3D] opacity-[0.4] blur-[80px]" />

        {/* Subtle accent — mid-right, hints of purple depth */}
        <div className="absolute top-[65%] right-[5%] w-[150px] h-[150px] rounded-full bg-[#6B3FA0] opacity-[0.12] blur-[60px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
