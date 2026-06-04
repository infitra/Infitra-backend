/**
 * PublicBeyondLiveBlock — Bundle 4.2.46 placeholder.
 *
 * Section 2's second beat. Previously held the "Join for the goals.
 * Stay for the momentum." headline + three bullet points (Direct
 * access to your Experts / A tribe moving with you / The bonds keep
 * growing).
 *
 * That copy was overpromising before the tribe-space side of the
 * product is fully built and demonstrable. Stripped to a minimal
 * "Coming soon" placeholder so the page reads honestly while the
 * experience layer ships.
 *
 * The previous content (headline, three bullets, icons) lives in
 * git history if we want to bring any of it back when the
 * experience layer is ready — see commit 4abe3e5 and before.
 */

export function PublicBeyondLiveBlock() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
          style={{ color: "#FF6130" }}
        >
          Inside the experience
        </p>
        <p
          className="text-base lg:text-lg font-medium"
          style={{ color: "#94a3b8", letterSpacing: "-0.005em" }}
        >
          Coming soon.
        </p>
      </div>
    </section>
  );
}
