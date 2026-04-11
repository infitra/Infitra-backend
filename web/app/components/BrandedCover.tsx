/**
 * BrandedCover — INFITRA branded default cover image.
 * Uses aspect-[3/2] to match Unsplash photo ratio.
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
  return (
    <div
      className={`relative overflow-hidden aspect-[3/2] ${className}`}
      style={{
        background: "linear-gradient(135deg, #0F2229 0%, #0d2a36 30%, #1a3340 50%, #2a1508 70%, #0F2229 100%)",
      }}
    >
      {/* Brand color spots */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          background: "radial-gradient(ellipse at 20% 80%, #9CF0FF 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #FF6130 0%, transparent 50%)",
        }}
      />

      {/* Logo mark watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none">
        <img src="/logo-mark.png" alt="" width={size === "lg" ? 160 : size === "md" ? 100 : 60} height={size === "lg" ? 160 : size === "md" ? 100 : 60} />
      </div>

      {/* Title overlay */}
      {title && (
        <div className="absolute inset-0 flex flex-col items-end justify-end p-4">
          <p className={`font-black font-headline text-white/80 tracking-tight text-right ${size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm"}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`font-headline text-[#9CF0FF]/40 mt-0.5 text-right ${size === "lg" ? "text-sm" : "text-[10px]"}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
