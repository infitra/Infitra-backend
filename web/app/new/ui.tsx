import Link from "next/link";

/**
 * Landing V2 — shared primitives. Brand constants + the small repeated
 * pieces (eyebrow, section header, CTA) so every module speaks the same
 * visual language. Server-safe (no client code).
 */

export const INK = "#0F2229";
export const ORANGE = "#FF6130";
export const CYAN = "#0891b2";
export const MUTED = "#475569";
export const FAINT = "#94a3b8";

export const CARD_SHADOW = "0 0 0 1px rgba(15,34,41,0.06), 0 10px 32px rgba(15,34,41,0.08)";
export const PRODUCT_SHADOW = "0 30px 80px rgba(15,34,41,0.18), 0 10px 30px rgba(15,34,41,0.08)";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] uppercase tracking-[0.25em] font-headline"
      style={{ color: CYAN, fontWeight: 700 }}
    >
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
      <div className="mb-3">
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h2
        className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight"
        style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      {sub && (
        <p className="text-base md:text-lg mt-5 leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function ApplyCTA({
  small = false,
  xl = false,
  micro,
}: {
  small?: boolean;
  xl?: boolean;
  micro?: string;
}) {
  return (
    <div className="text-center">
      <Link
        href="/apply"
        className={`inline-block whitespace-nowrap rounded-full text-white font-headline tracking-wide transition-transform hover:scale-[1.03] ${
          xl ? "px-14 py-5 text-xl" : small ? "px-8 py-3 text-base" : "px-12 py-4 text-lg"
        }`}
        style={{
          backgroundColor: ORANGE,
          fontWeight: 700,
          boxShadow: "0 8px 28px rgba(255,97,48,0.35), 0 2px 10px rgba(255,97,48,0.20)",
        }}
      >
        Apply for the pilot
      </Link>
      {micro && (
        <p className="text-xs mt-4 tracking-wide" style={{ color: FAINT }}>
          {micro}
        </p>
      )}
    </div>
  );
}

/** Tiny person chip — avatar + name + role-colored tagline. */
export function Person({
  avatar,
  name,
  tag,
  color,
  size = 40,
}: {
  avatar: string;
  name: string;
  tag: string;
  color: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="shrink-0 rounded-full overflow-hidden inline-block"
        style={{ width: size, height: size, border: `1.5px solid ${color}59` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" className="w-full h-full object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-headline truncate" style={{ color: INK, fontWeight: 700 }}>
          {name}
        </span>
        <span
          className="block text-[9px] uppercase tracking-widest font-headline truncate"
          style={{ color, fontWeight: 700 }}
        >
          {tag}
        </span>
      </span>
    </div>
  );
}
