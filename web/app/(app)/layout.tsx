export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#071318] relative">
      {/* Ambient depth — nebula-like glow zones */}
      <div className="ambient-glow" />
      <div className="ambient-glow-deep" />
      <div className="noise-overlay" />

      {/* Content above the glow layers */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
