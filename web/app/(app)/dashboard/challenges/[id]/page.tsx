import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChallengeEditForm } from "./ChallengeEditForm";

export const metadata = {
  title: "Challenge — INFITRA",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "text-slate-600 bg-slate-100/80 border-slate-200",
  },
  published: {
    label: "Published",
    className: "text-emerald-700 bg-emerald-100/80 border-emerald-200",
  },
  completed: {
    label: "Completed",
    className: "text-slate-500 bg-slate-100/60 border-slate-200",
  },
  canceled: {
    label: "Canceled",
    className: "text-rose-700 bg-rose-100/80 border-rose-200",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!challenge) notFound();

  const isDraft = challenge.status === "draft";
  const s = STATUS_STYLES[challenge.status] ?? STATUS_STYLES.draft;
  const priceCHF = (challenge.price_cents ?? 0) / 100;

  // Fetch linked sessions
  const { data: linkedRows } = await supabase
    .from("app_challenge_session")
    .select("session_id, app_session(id, title, description, image_url, start_time, duration_minutes, status)")
    .eq("challenge_id", id);

  const linkedSessions = (linkedRows ?? [])
    .map((r: any) => r.app_session)
    .filter(Boolean);

  // Sort linked sessions by start_time
  linkedSessions.sort(
    (a: any, b: any) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div className="py-10 max-w-2xl mx-auto">
      <Link
        href="/dashboard/challenges"
        className="text-xs transition-colors mb-6 flex items-center gap-1.5 font-headline"
        style={{ color: "#64748b" }}
      >
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All Challenges
      </Link>

      {isDraft ? (
        <>
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight" style={{ color: "#0F2229" }}>Edit Challenge</h1>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.className}`}>{s.label}</span>
          </div>
          <ChallengeEditForm challenge={challenge} linkedSessions={linkedSessions} />
        </>
      ) : (
        <div className="max-w-3xl mx-auto">
          {/* Cover image */}
          {challenge.image_url && (
            <div className="aspect-[3/1] rounded-2xl overflow-hidden mb-6">
              <img src={challenge.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight" style={{ color: "#0F2229" }}>{challenge.title}</h1>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.className}`}>{s.label}</span>
          </div>
          {challenge.description && (
            <p className="text-sm max-w-xl mb-6" style={{ color: "#64748b" }}>{challenge.description}</p>
          )}

          {/* Info cards */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: "Starts", value: formatDate(challenge.start_date) },
              { label: "Ends", value: formatDate(challenge.end_date) },
              { label: "Sessions", value: String(linkedSessions.length) },
              { label: "Price", value: priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(15,34,41,0.04)", border: "1px solid rgba(15,34,41,0.08)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1" style={{ color: "rgba(15,34,41,0.45)" }}>{label}</p>
                <p className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Sessions — horizontal scroll with images */}
          {linkedSessions.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-3" style={{ color: "rgba(15,34,41,0.55)" }}>
                {linkedSessions.length} Session{linkedSessions.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {linkedSessions.map((sess: any, idx: number) => (
                  <Link key={sess.id} href={`/dashboard/sessions/${sess.id}`} className="shrink-0 w-56 rounded-xl overflow-hidden infitra-card-link group block">
                    <div className="aspect-[3/2] relative">
                      {sess.image_url ? (
                        <>
                          <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
                          <img src="/logo-mark.png" alt="" width={40} height={40} style={{ opacity: 0.1 }} />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="text-sm font-black font-headline text-white line-clamp-1 group-hover:text-[#FF6130]">{sess.title}</p>
                      </div>
                      <span className="absolute top-2 left-3 text-[10px] font-black text-white/50">#{idx + 1}</span>
                    </div>
                    <div className="p-3">
                      {sess.description && <p className="text-xs mb-1 line-clamp-2" style={{ color: "#94a3b8" }}>{sess.description}</p>}
                      <p className="text-[10px]" style={{ color: "#64748b" }}>
                        {new Date(sess.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {sess.duration_minutes} min
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {challenge.status === "published" && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full w-fit" style={{ backgroundColor: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.30)" }}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold font-headline" style={{ color: "#047857" }}>Live — visible to participants</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
