export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#020810] relative overflow-hidden">
      {/* Galaxy depth system — radiant light sources, not fog */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">

        {/* ── CYAN LIGHTNING — top right corner ─────────────── */}
        {/* Hot white-cyan core */}
        <div className="absolute top-[30px] right-[80px] w-[40px] h-[40px] rounded-full bg-white opacity-[0.6] blur-[8px]" />
        {/* Bright cyan inner ring */}
        <div className="absolute top-[0px] right-[40px] w-[120px] h-[120px] rounded-full bg-[#9CF0FF] opacity-[0.5] blur-[25px]" />
        {/* Cyan mid spread */}
        <div className="absolute -top-[40px] -right-[20px] w-[300px] h-[300px] rounded-full bg-[#9CF0FF] opacity-[0.15] blur-[60px]" />
        {/* Cyan far reach */}
        <div className="absolute -top-[100px] -right-[100px] w-[600px] h-[600px] rounded-full bg-[#4AB8CC] opacity-[0.06] blur-[100px]" />

        {/* ── ORANGE FIRE — bottom left ────────────────────── */}
        {/* Hot core */}
        <div className="absolute bottom-[120px] left-[40px] w-[30px] h-[30px] rounded-full bg-[#FFB088] opacity-[0.5] blur-[6px]" />
        {/* Bright orange inner */}
        <div className="absolute bottom-[80px] left-[10px] w-[100px] h-[100px] rounded-full bg-[#FF6130] opacity-[0.35] blur-[20px]" />
        {/* Orange mid spread */}
        <div className="absolute bottom-[20px] -left-[40px] w-[250px] h-[250px] rounded-full bg-[#FF6130] opacity-[0.08] blur-[60px]" />

        {/* ── DEEP BLUE NEBULA — center creates galaxy depth ── */}
        <div className="absolute top-[45%] left-[35%] w-[200px] h-[200px] rounded-full bg-[#1A2F6E] opacity-[0.5] blur-[50px]" />
        <div className="absolute top-[40%] left-[25%] w-[500px] h-[400px] rounded-full bg-[#0C1A3A] opacity-[0.3] blur-[80px]" />

        {/* ── PURPLE ACCENT — right side depth ─────────────── */}
        <div className="absolute top-[55%] right-[10%] w-[60px] h-[60px] rounded-full bg-[#9B6FE8] opacity-[0.25] blur-[15px]" />
        <div className="absolute top-[50%] right-[5%] w-[200px] h-[200px] rounded-full bg-[#6B3FA0] opacity-[0.08] blur-[50px]" />

        {/* ── SECONDARY CYAN — left side, smaller accent ───── */}
        <div className="absolute top-[25%] left-[5%] w-[20px] h-[20px] rounded-full bg-[#9CF0FF] opacity-[0.3] blur-[5px]" />
        <div className="absolute top-[23%] left-[3%] w-[80px] h-[80px] rounded-full bg-[#9CF0FF] opacity-[0.08] blur-[25px]" />

        {/* ── BOTTOM EDGE — deep gradient fade ─────────────── */}
        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#020810] via-[#040E18] to-transparent opacity-[0.8]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
