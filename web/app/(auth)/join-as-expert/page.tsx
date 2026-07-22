import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinAsExpertForm } from "./JoinAsExpertForm";

/**
 * /join-as-expert?code=… — the founding expert's door (pilot supply gate,
 * Option B). Each approved applicant gets a personal, single-use invite
 * link; this page pre-validates the code for friendly UX and renders the
 * creator signup. Real enforcement lives in the app_handle_new_user
 * trigger: without a valid code the account is never created, so the
 * public auth API cannot mint creators either.
 *
 * Public route (proxy allowlist): invitees arrive from outside while the
 * beta wall is still up. Their signup also plants the wall cookie, so an
 * invited expert never sees the wall at all.
 */

export const metadata = {
  title: "Founding expert invitation · INFITRA",
  robots: { index: false, follow: false },
};

export default async function JoinAsExpertPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const trimmed = code?.trim() ?? "";

  let valid = false;
  if (trimmed) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("app_validate_creator_invite", {
      p_code: trimmed,
    });
    valid = data === true;
  }

  if (!valid) {
    return (
      <div className="w-full max-w-md">
        <div
          className="rounded-3xl p-8 md:p-10 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(15,34,41,0.08)",
            boxShadow: "0 16px 48px rgba(15,34,41,0.06)",
          }}
        >
          <h1
            className="text-2xl font-headline tracking-tight mb-3"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            This invite link is not active.
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#475569" }}>
            It may have been used already, or it expired. Invites are personal
            and single use. Reply to your acceptance email and we will send you
            a fresh one.
          </p>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Not invited yet?{" "}
            <Link href="/apply" className="hover:opacity-80" style={{ color: "#0891b2", fontWeight: 700 }}>
              Apply for the founding pilot →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <JoinAsExpertForm code={trimmed} />
    </div>
  );
}
