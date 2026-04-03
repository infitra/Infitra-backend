import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#9CF0FF]/4 blur-[150px]" />
      </div>
      <div className="relative z-10 text-center">
        <p className="text-xs text-[#9CF0FF]/30 uppercase tracking-widest font-bold mb-4 font-headline">
          Coming Soon
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white font-headline tracking-tight mb-4">
          Discover
        </h1>
        <p className="text-sm text-[#9CF0FF]/40 max-w-sm">
          Browse live sessions, challenges, and creators. This is where you
          train.
        </p>
      </div>
    </div>
  );
}
