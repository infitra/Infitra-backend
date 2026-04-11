import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PreviewActions } from "./PreviewActions";
import { BrandedCover } from "@/app/components/BrandedCover";

export const metadata = { title: "Preview Challenge — INFITRA" };

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatSessionDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function formatSessionTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function ChallengePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: challenge } = await supabase.from("app_challenge").select("*").eq("id", id).eq("owner_id", user.id).single();
  if (!challenge) notFound();
  if (challenge.status !== "draft") redirect(`/dashboard/challenges/${id}`);

  const { data: profile } = await supabase.from("app_profile").select("display_name, username, avatar_url").eq("id", user.id).single();

  const { data: linkedRows } = await supabase
    .from("app_challenge_session")
    .select("session_id, app_session(id, title, start_time, duration_minutes, image_url)")
    .eq("challenge_id", id);

  const linkedSessions = (linkedRows ?? []).map((r: any) => r.app_session).filter(Boolean)
    .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const priceCHF = (challenge.price_cents ?? 0) / 100;
  const totalMinutes = linkedSessions.reduce((a: number, s: any) => a + (s.duration_minutes ?? 0), 0);

  return (
    <div className="py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs uppercase tracking-widest font-bold font-headline" style={{ color: "rgba(15, 34, 41, 0.55)" }}>
          Preview — how participants will see this
        </p>
        <Link href={`/dashboard/challenges/${id}`} className="text-xs flex items-center gap-1.5 font-headline" style={{ color: "#64748b" }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Edit
        </Link>
      </div>

      {/* Challenge card */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        {/* Cover image or branded default */}
        {challenge.image_url ? (
          <div className="h-48 md:h-56 relative">
            <img src={challenge.image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
          </div>
        ) : (
          <BrandedCover title={challenge.title} subtitle={`${linkedSessions.length} sessions · ${totalMinutes} min`} size="lg" />
        )}

        <div className="p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-3" style={{ color: "#0F2229" }}>
            {challenge.title}
          </h1>

          {challenge.description && (
            <p className="text-sm leading-relaxed mb-6 max-w-lg whitespace-pre-line" style={{ color: "#64748b" }}>
              {challenge.description}
            </p>
          )}

          {/* Info cards */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: "Starts", value: formatDate(challenge.start_date) },
              { label: "Ends", value: formatDate(challenge.end_date) },
              ...(challenge.capacity ? [{ label: "Spots", value: `${challenge.capacity} available` }] : []),
              { label: "Price", value: priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(15, 34, 41, 0.04)", border: "1px solid rgba(15, 34, 41, 0.08)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1" style={{ color: "rgba(15, 34, 41, 0.45)" }}>{label}</p>
                <p className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Sessions — horizontal scroll with images */}
          {linkedSessions.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-3" style={{ color: "rgba(15, 34, 41, 0.55)" }}>
                {linkedSessions.length} Session{linkedSessions.length !== 1 ? "s" : ""} · {totalMinutes} min total
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {linkedSessions.map((sess: any, idx: number) => (
                  <div key={sess.id} className="shrink-0 w-52 rounded-xl overflow-hidden infitra-card">
                    {/* Session image */}
                    {sess.image_url ? (
                      <div className="h-28 relative">
                        <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-sm font-black font-headline text-white line-clamp-1">{sess.title}</p>
                        </div>
                        <span className="absolute top-2 left-3 text-[10px] font-black text-white/50">#{idx + 1}</span>
                      </div>
                    ) : (
                      <BrandedCover title={sess.title} size="sm" />
                    )}
                    <div className="p-3">
                      {!sess.image_url && (
                        <p className="text-sm font-bold font-headline mb-1" style={{ color: "#0F2229" }}>{sess.title}</p>
                      )}
                      <p className="text-[10px]" style={{ color: "#64748b" }}>
                        {formatSessionDate(sess.start_time)} at {formatSessionTime(sess.start_time)} · {sess.duration_minutes} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creator — branded, prominent */}
          <div className="pt-6 border-t" style={{ borderColor: "rgba(15, 34, 41, 0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-3" style={{ color: "#FF6130" }}>Your Host</p>
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" style={{ border: "3px solid #FF6130", boxShadow: "0 2px 10px rgba(255,97,48,0.2)" }} />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255, 97, 48, 0.12)", border: "3px solid #FF6130" }}>
                  <span className="text-xl font-black font-headline" style={{ color: "#FF6130" }}>{(profile?.display_name ?? "?")[0].toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="text-base font-black font-headline" style={{ color: "#0F2229" }}>{profile?.display_name}</p>
                <p className="text-xs" style={{ color: "#64748b" }}>Creator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PreviewActions challengeId={challenge.id} />
    </div>
  );
}
