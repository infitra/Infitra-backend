import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";

/**
 * Auth shell — same cream + wave treatment as the landing page and the
 * rest of the production app. Replaces the prior dark navy treatment so
 * sign-in / sign-up / beta-access feel like one continuous brand surface.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Brand wordmark — the only chrome on auth pages */}
        <Link href="/" className="mb-10 flex items-center gap-3">
          <img
            src="/logo-mark.png"
            alt="INFITRA"
            width={36}
            height={36}
            className="block rounded-lg"
          />
          <span
            className="text-2xl tracking-tight font-headline leading-none"
            style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            INFITRA
          </span>
        </Link>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
