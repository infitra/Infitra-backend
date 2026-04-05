export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      {/* Ambient depth — glow zones */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Cyan glow — top right */}
        <div className="absolute -top-[100px] -right-[100px] w-[600px] h-[600px] rounded-full bg-[#9CF0FF] opacity-[0.07] blur-[150px]" />
        {/* Orange glow — bottom left */}
        <div className="absolute bottom-[10%] -left-[150px] w-[500px] h-[500px] rounded-full bg-[#FF6130] opacity-[0.05] blur-[150px]" />
        {/* Deep teal glow — center bottom */}
        <div className="absolute -bottom-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0F2229] opacity-[0.5] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
