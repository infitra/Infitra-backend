export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: `
        radial-gradient(ellipse 80% 60% at 70% 20%, rgba(156, 240, 255, 0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 20% 80%, rgba(255, 97, 48, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse 100% 100% at 50% 50%, rgba(10, 16, 81, 0.4) 0%, transparent 70%),
        linear-gradient(135deg, #020810 0%, #071320 25%, #0A1A3D 45%, #081028 65%, #030B10 100%)
      `
    }}>
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
