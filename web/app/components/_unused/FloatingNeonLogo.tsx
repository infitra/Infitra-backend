/**
 * FloatingNeonLogo — ARCHIVED COMPONENT (not currently imported anywhere).
 *
 * The original animated cyan logo treatment from the landing page hero.
 * Layered depth shaders + cyan glow halos + float-twist animation.
 * Designed for both dark and cream backgrounds (depth shaders included
 * in light-bg variant).
 *
 * Reference for the float-twist animation: web/app/globals.css (`alive-pulse`
 * keyframes + `.float-twist` class).
 *
 * To restore on the landing or anywhere else: import this component and
 * drop it where you need the floating logo. Sized via the wrapper (the
 * inner depth shaders scale to fill).
 *
 * Saved on 2026-04-25 when the landing was switched to a static brand-logo
 * presentation. Kept here in case we want to bring the animated treatment
 * back for a future hero, splash screen, or branded moment.
 */

"use client";

import Image from "next/image";

interface Props {
  /** Outer container size (e.g. "w-[300px] h-[300px] md:w-[400px] md:h-[400px]"). */
  className?: string;
  /** Variant of background the logo sits on. Affects the halo + depth shader intensity. */
  variant?: "dark" | "cream";
}

export function FloatingNeonLogo({
  className = "w-[300px] h-[300px] md:w-[400px] md:h-[400px]",
  variant = "dark",
}: Props) {
  if (variant === "cream") {
    // Light-bg version (used during the cream-themed Path B landing).
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Layered cyan halos for atmospheric glow on cream. */}
        <div className="absolute inset-0 scale-[1.6] rounded-full bg-[#9CF0FF]/40 blur-[90px]" />
        <div className="absolute inset-0 scale-[1.1] rounded-full bg-[#9CF0FF]/35 blur-[40px]" />

        <div className="float-twist absolute inset-0">
          <div
            className="absolute w-full h-full translate-y-[1px]"
            style={{
              filter: "brightness(0.6) saturate(1.4)",
              maskImage: "linear-gradient(to top, black 25%, transparent 75%)",
              WebkitMaskImage: "linear-gradient(to top, black 25%, transparent 75%)",
            }}
          >
            <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
          </div>
          <div className="absolute w-full h-full">
            <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
          </div>
          <div
            className="absolute w-full h-full"
            style={{
              maskImage: "linear-gradient(315deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 35%, transparent 55%)",
              WebkitMaskImage: "linear-gradient(315deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 35%, transparent 55%)",
              filter: "brightness(0.65) saturate(1.5)",
            }}
          >
            <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
          </div>
          <div
            className="absolute w-full h-full"
            style={{
              maskImage: "linear-gradient(140deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
              WebkitMaskImage: "linear-gradient(140deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
              filter: "brightness(1.4) saturate(0.85)",
            }}
          >
            <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
          </div>
          <div
            className="absolute w-full h-full"
            style={{
              maskImage: "linear-gradient(150deg, rgba(0,0,0,0.4) 0%, transparent 22%)",
              WebkitMaskImage: "linear-gradient(150deg, rgba(0,0,0,0.4) 0%, transparent 22%)",
              filter: "brightness(1.85) saturate(0.5)",
            }}
          >
            <Image src="/logo-mark-cyan.png" alt="INFITRA" fill className="object-contain" />
          </div>
        </div>
      </div>
    );
  }

  // Dark-bg version — original treatment, neon look.
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft atmospheric halo. */}
      <div className="absolute inset-0 scale-[1.8] rounded-full bg-[#9CF0FF]/[0.06] blur-[100px]" />

      <div className="float-twist absolute inset-0">
        {/* Ground shadow on dark stage. */}
        <div className="absolute w-[70%] h-[12%] bottom-[-12%] left-[15%] rounded-full bg-[#071318] blur-[20px] opacity-60" />
        {/* Deep shadow layer offset down-right. */}
        <div
          className="absolute w-full h-full translate-x-[4px] translate-y-[5px]"
          style={{ filter: "brightness(0) opacity(0.3) blur(4px)" }}
        >
          <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
        </div>
        {/* Dark underside. */}
        <div
          className="absolute w-full h-full translate-y-[2px]"
          style={{
            filter: "brightness(0.4) saturate(1.4)",
            maskImage: "linear-gradient(to top, black 30%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 80%)",
          }}
        >
          <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
        </div>
        {/* Base mark — cyan core. */}
        <div className="absolute w-full h-full">
          <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
        </div>
        {/* Mid-tone depth bottom-right. */}
        <div
          className="absolute w-full h-full"
          style={{
            maskImage: "linear-gradient(315deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
            WebkitMaskImage: "linear-gradient(315deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
            filter: "brightness(0.55) saturate(1.6)",
          }}
        >
          <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
        </div>
        {/* Highlight top-left. */}
        <div
          className="absolute w-full h-full"
          style={{
            maskImage: "linear-gradient(140deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
            WebkitMaskImage: "linear-gradient(140deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
            filter: "brightness(1.35) saturate(0.8)",
          }}
        >
          <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
        </div>
        {/* Specular rim — bright neon edge top-left. */}
        <div
          className="absolute w-full h-full"
          style={{
            maskImage: "linear-gradient(150deg, rgba(0,0,0,0.35) 0%, transparent 20%)",
            WebkitMaskImage: "linear-gradient(150deg, rgba(0,0,0,0.35) 0%, transparent 20%)",
            filter: "brightness(2) saturate(0.4)",
          }}
        >
          <Image src="/logo-mark-cyan.png" alt="INFITRA" fill className="object-contain" />
        </div>
      </div>
    </div>
  );
}
