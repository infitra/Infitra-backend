/**
 * Instant feedback for /me. Without a loading boundary, force-dynamic
 * means a tapped link on a phone does NOTHING until every query returns —
 * which read as "reload does not load nicely" in the 13 Aug rehearsal.
 * Same visual language as the live room's connecting state.
 */
export default function MeLoading() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
          style={{
            borderColor: "rgba(8, 145, 178, 0.20)",
            borderTopColor: "#0891b2",
          }}
        />
        <p className="text-sm font-headline" style={{ color: "#64748b" }}>
          Loading your journey...
        </p>
      </div>
    </div>
  );
}
