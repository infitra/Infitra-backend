/**
 * Avatar — shared across the Experience Space (YOU panel, cover, feed).
 *
 * Plain <img> (not next/image) on purpose: avatars are tiny, already-optimized
 * profile URLs and many are null → initial fallback. `ring` tints the border +
 * the initial bubble (owner = orange, cohost = cyan, etc).
 */

export function Avatar({
  src,
  name,
  size = 32,
  ring,
}: {
  src: string | null;
  name: string;
  size?: number;
  ring?: string;
}) {
  const border = ring ? `2px solid ${ring}` : "2px solid #fff";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black shrink-0"
      style={{ width: size, height: size, border, backgroundColor: ring ?? "#0891b2", fontSize: size * 0.4 }}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
