export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced by the proxy — no redundant getUser() call here
  // to avoid consuming refresh tokens or conflicting with proxy token refresh.
  return (
    <div className="min-h-screen bg-[#071318]">{children}</div>
  );
}
