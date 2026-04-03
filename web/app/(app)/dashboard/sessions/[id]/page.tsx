import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SessionActions } from "./SessionActions";

export const metadata = {
  title: "Session — INFITRA",
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-[#9CF0FF]/50 bg-[#9CF0FF]/8 border-[#9CF0FF]/15" },
  published: { label: "Published", color: "text-green-400 bg-green-400/8 border-green-400/20" },
  scheduled: { label: "Scheduled", color: "text-blue-400 bg-blue-400/8 border-blue-400/20" },
  ended: { label: "Ended", color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/5 border-[#9CF0FF]/10" },
  completed: { label: "Completed", color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/5 border-[#9CF0FF]/10" },
  canceled: { label: "Canceled", color: "text-red-400/60 bg-red-400/8 border-red-400/15" },
};

export default async function SessionDetailPage({
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

  const { data: session } = await supabase
    .from("app_session")
    .select("*")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (!session) notFound();

  const s = STATUS_STYLES[session.status] ?? STATUS_STYLES.draft;
  const priceCHF = (session.price_cents ?? 0) / 100;

  return (
    <div className="py-10 max-w-3xl mx-auto">
      <Link
        href="/dashboard/sessions"
        className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-6 flex items-center gap-1.5 font-headline"
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
        All Sessions
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
              {session.title}
            </h1>
            <span
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
            >
              {s.label}
            </span>
          </div>
          {session.description && (
            <p className="text-sm text-[#9CF0FF]/40 max-w-xl">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
          <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
            When
          </p>
          <p className="text-sm font-semibold text-white">
            {formatDateTime(session.start_time)}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
          <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
            Duration
          </p>
          <p className="text-sm font-semibold text-white">
            {session.duration_minutes} min
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
          <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
            Capacity
          </p>
          <p className="text-sm font-semibold text-white">
            {session.capacity ?? "Unlimited"}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
          <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
            Price
          </p>
          <p className="text-sm font-semibold text-white">
            {priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free"}
          </p>
        </div>
      </div>

      <SessionActions
        sessionId={session.id}
        status={session.status}
      />
    </div>
  );
}
