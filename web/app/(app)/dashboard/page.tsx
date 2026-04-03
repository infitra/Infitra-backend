import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard — INFITRA",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, role, created_at")
    .eq("id", user!.id)
    .single();

  return (
    <div className="py-10">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-white font-headline tracking-tight">
          Welcome, {profile?.display_name}.
        </h1>
        <p className="text-lg text-[#9CF0FF]/40 mt-2">
          Your creator dashboard. Build, collaborate, go live.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Sessions", value: "0", sub: "Draft & published" },
          { label: "Challenges", value: "0", sub: "Active programmes" },
          { label: "Followers", value: "0", sub: "Community reach" },
          { label: "Earnings", value: "CHF 0", sub: "Total revenue" },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="p-6 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10"
          >
            <p className="text-xs font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-3">
              {label}
            </p>
            <p className="text-3xl font-black text-white font-headline tracking-tight">
              {value}
            </p>
            <p className="text-xs text-[#9CF0FF]/25 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-8 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#FF6130]/25 transition-colors group">
          <h3 className="text-xl font-black text-white font-headline tracking-tight mb-2 group-hover:text-[#FF6130] transition-colors">
            Create a Session
          </h3>
          <p className="text-sm text-[#9CF0FF]/40 mb-4">
            Set up a live session, add collaborators, and publish it to your
            audience.
          </p>
          <span className="text-xs font-bold text-[#FF6130] uppercase tracking-widest font-headline">
            Coming soon
          </span>
        </div>

        <div className="p-8 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 transition-colors group">
          <h3 className="text-xl font-black text-white font-headline tracking-tight mb-2 group-hover:text-[#9CF0FF] transition-colors">
            Create a Challenge
          </h3>
          <p className="text-sm text-[#9CF0FF]/40 mb-4">
            Build a multi-session programme with continuing communities and
            shared goals.
          </p>
          <span className="text-xs font-bold text-[#9CF0FF] uppercase tracking-widest font-headline">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
