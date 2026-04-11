/**
 * BrandedCover — INFITRA branded default cover image.
 *
 * Renders a gradient background with the logo mark and optional title.
 * Used as the default when no custom image is uploaded.
 * Pure CSS/HTML — no image generation needed.
 */
export function BrandedCover({
  title,
  subtitle,
  size = "md",
  className = "",
}: {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const heights = { sm: "h-24", md: "h-40", lg: "h-56" };

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${heights[size]} ${className}`}
      style={{
        background: "linear-gradient(135deg, #0F2229 0%, #0d2a36 30%, #1a3340 50%, #2a1508 70%, #0F2229 100%)",
      }}
    >
      {/* Subtle wave pattern using brand colors */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          background: "radial-gradient(ellipse at 20% 80%, #9CF0FF 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #FF6130 0%, transparent 50%)",
        }}
      />

      {/* Logo mark watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none">
        <img src="/logo-mark.png" alt="" width={size === "lg" ? 160 : size === "md" ? 120 : 80} height={size === "lg" ? 160 : size === "md" ? 120 : 80} />
      </div>

      {/* Title overlay */}
      {title && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className={`font-black font-headline text-white/80 tracking-tight ${size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm"}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`font-headline text-[#9CF0FF]/40 mt-1 ${size === "lg" ? "text-sm" : "text-xs"}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
