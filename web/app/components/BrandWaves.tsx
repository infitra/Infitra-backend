/**
 * The INFITRA waves, in one place.
 *
 * Verbatim from the app background (WaveFlowingBackground.tsx) and the post
 * templates (content/build_posts.py): the same diagonal paths, lower-left to
 * upper-right, cyan-bright into orange. Never redrawn, only re-stopped for
 * the ground they sit on.
 *
 * `CardWaves` is the light band the founding card wears as its hero (it lived
 * inside FoundingCard.tsx until the landing's hero tiles needed it too, and a
 * client component may not pull the whole card module along).
 * `StageWaves` is the dark theme: the same paths with the gradients pulled
 * right down, so dark teal stays dominant and cream type keeps its contrast.
 *
 * Both are pure SVG with no hooks, so either module graph may import them.
 */

const CYAN_BRIGHT = "#9CF0FF";
const ORANGE = "#FF6130";
const TEAL = "#0C262E";

const PATH_1 =
  "M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z";
const PATH_2 =
  "M -300 1500 C 150 1180, 500 1330, 850 980 C 1200 620, 1550 800, 1950 -300 L 1950 -1000 C 1550 -50, 1200 -250, 850 100 C 500 460, 150 250, -300 720 Z";
const PATH_3 =
  "M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z";

const WAVE_STOPS = (
  <>
    <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="0.92" />
    <stop offset="35%" stopColor={CYAN_BRIGHT} stopOpacity="0.62" />
    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.40" />
    <stop offset="65%" stopColor={ORANGE} stopOpacity="0.62" />
    <stop offset="100%" stopColor={ORANGE} stopOpacity="0.92" />
  </>
);

/**
 * Three diagonal bands, the back one blurred in CSS. Fitted with
 * "xMidYMid slice" so the bands sweep through instead of ending in frame.
 * Static: cards live in grids. The container masks them out towards the
 * bottom so the band fades into cream where the content sits.
 */
export function CardWaves({ id }: { id: string }) {
  const svg = "absolute inset-0 w-full h-full";
  return (
    <>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className={svg} style={{ filter: "blur(20px)" }} aria-hidden>
        <defs>
          <linearGradient id={`${id}-1`} x1="0%" y1="100%" x2="100%" y2="0%">
            {WAVE_STOPS}
          </linearGradient>
        </defs>
        <path d={PATH_1} fill={`url(#${id}-1)`} />
      </svg>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className={svg} aria-hidden>
        <defs>
          <linearGradient id={`${id}-2`} x1="0%" y1="100%" x2="100%" y2="0%">
            {WAVE_STOPS}
          </linearGradient>
        </defs>
        <path d={PATH_2} fill={`url(#${id}-2)`} />
      </svg>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className={svg} aria-hidden>
        <defs>
          <linearGradient id={`${id}-3`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="1" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor={ORANGE} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d={PATH_3} fill={`url(#${id}-3)`} />
      </svg>
    </>
  );
}

/**
 * The dark stage: two of the same bands, gradients pulled right down so the
 * teal ground stays dominant. Stretched ("none") because a stage is wide and
 * shallow and the bands should sweep across it, not crop to a corner.
 */
export function StageWaves({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-d1`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="0.10" />
          <stop offset="40%" stopColor={CYAN_BRIGHT} stopOpacity="0.045" />
          <stop offset="52%" stopColor={TEAL} stopOpacity="0" />
          <stop offset="64%" stopColor={ORANGE} stopOpacity="0.05" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0.11" />
        </linearGradient>
        <linearGradient id={`${id}-d2`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="0.07" />
          <stop offset="50%" stopColor={TEAL} stopOpacity="0" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0.07" />
        </linearGradient>
      </defs>
      <path d={PATH_1} fill={`url(#${id}-d1)`} />
      <path d={PATH_3} fill={`url(#${id}-d2)`} />
    </svg>
  );
}
