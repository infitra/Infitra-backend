/**
 * Avatar — shared across the Experience Space (YOU panel, cover, feed).
 *
 * next/image, because the old assumption here ("avatars are tiny,
 * already-optimized profile URLs") was simply false: members upload straight
 * from their phones, and this experience's avatars totalled ~8 MB with a
 * 2.37 MB single PNG. A feed renders dozens of these. `ring` tints the border
 * + the initial bubble (owner = orange, cohost = cyan, etc).
 */

import Image from "next/image";

export function Avatar({
  src,
  name,
  size = 32,
  ring,
  bg,
}: {
  src: string | null;
  name: string;
  size?: number;
  /** Border colour (does NOT colour the no-photo bubble). */
  ring?: string;
  /** No-photo bubble background. Defaults to ring, then cyan — pass this when
   *  the ring is white/light so the initial stays legible. */
  bg?: string;
}) {
  const border = ring ? `2px solid ${ring}` : "2px solid #fff";
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        sizes={`${size}px`}
        loading="lazy"
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black shrink-0"
      style={{ width: size, height: size, border, backgroundColor: bg ?? ring ?? "#0891b2", fontSize: size * 0.4 }}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
