import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PreviewActions } from "./PreviewActions";

export const metadata = {
  title: "Preview Session — INFITRA",
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    " at " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export default async function SessionPreviewPage({
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

  // If already published, redirect to the detail page
  if (session.status !== "draft") {
    redirect(`/dashboard/sessions/${id}`);
  }

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  const priceCHF = (session.price_cents ?? 0) / 100;

  return (
    <div className="py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-[#9CF0FF]/40 uppercase tracking-widest font-bold font-headline">
          Preview &mdash; how participants will see this
        </p>
        <Link
          href={`/dashboard/sessions/${id}`}
          className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors flex items-center gap-1.5 font-headline"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Edit
        </Link>
      </div>

      {/* Session card preview */}
      <div className="rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/40" />

        <div className="p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-3">
            {session.title}
          </h1>

          {session.description && (
            <p className="text-sm text-[#9CF0FF]/50 leading-relaxed mb-8 max-w-lg">
              {session.description}
            </p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                When
              </p>
              <p className="text-sm font-semibold text-white">
                {formatDateTime(session.start_time)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                Duration
              </p>
              <p className="text-sm font-semibold text-white">
                {session.duration_minutes} min
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                Spots
              </p>
              <p className="text-sm font-semibold text-white">
                {session.capacity ? `${session.capacity} available` : "Unlimited"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                Price
              </p>
              <p className="text-sm font-semibold text-white">
                {priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free"}
              </p>
            </div>
          </div>

          {/* Host badge */}
          <div className="flex items-center gap-3 pt-6 border-t border-[#9CF0FF]/8">
            <div className="w-9 h-9 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/30 flex items-center justify-center">
              <span className="text-sm font-black text-[#FF6130] font-headline">
                {(profile?.display_name ?? "?")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white font-headline">
                {profile?.display_name}
              </p>
              <p className="text-[10px] text-[#9CF0FF]/30">Host</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <PreviewActions sessionId={session.id} />
    </div>
  );
}
