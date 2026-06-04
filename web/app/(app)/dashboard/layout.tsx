import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator" && profile?.role !== "admin") {
    // Pilot: participants have no dashboard; send to landing.
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      {/* Unified app nav (creator variant) — single source of truth, shared
          with every participant surface. */}
      <ParticipantNav displayName={profile?.display_name ?? null} role={profile?.role} />

      {/* Content */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
