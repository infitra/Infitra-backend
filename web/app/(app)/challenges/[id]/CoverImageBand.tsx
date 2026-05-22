/**
 * CoverImageBand — Bundle 4.2.2.
 *
 * Conditional cinematic band at the very top of the buyer page. Sits
 * between the nav and the product card. Edge-to-edge on mobile, slightly
 * contained on desktop. Renders nothing when no cover image is set —
 * no fallback gradient, no placeholder. Just disappears, and the card
 * moves up to the top.
 *
 * This is the cover image's new home (was inside the hero in 4.2.0,
 * was the Journey chapter band in 4.2.1, now back at the top because
 * the user wants it there as the optional atmospheric layer).
 *
 * Aspect ratio: 21:9 on desktop (cinematic), 16:9 on mobile (taller,
 * works with portrait-orientation photos better). Contained max width
 * matches the rest of the page so it doesn't fight with the card below.
 */

interface Props {
  imageUrl: string | null;
}

export function CoverImageBand({ imageUrl }: Props) {
  if (!imageUrl) return null;

  return (
    <div className="px-6 lg:px-12 pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto">
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: "16 / 9",
            borderRadius: "1.5rem",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.04), 0 12px 40px rgba(15,34,41,0.08)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
