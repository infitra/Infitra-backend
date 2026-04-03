import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#071318] flex flex-col items-center justify-center px-6 relative">
      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#9CF0FF]/4 blur-[150px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="relative z-10 mb-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl overflow-hidden">
            <Image
              src="/logo-mark.png"
              alt="INFITRA"
              width={40}
              height={40}
              className="block"
            />
          </div>
          <span className="text-2xl font-black text-[#FF6130] tracking-tighter font-headline italic">
            INFITRA
          </span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
