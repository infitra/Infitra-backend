export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: `
        radial-gradient(ellipse 80% 50% at 80% 10%, rgba(156, 240, 255, 0.08) 0%, transparent 70%),
        radial-gradient(ellipse 50% 60% at 10% 90%, rgba(255, 97, 48, 0.04) 0%, transparent 60%),
        #071318
      `
    }}>
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
