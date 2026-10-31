import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinAsExpertForm } from "./JoinAsExpertForm";

/**
 * /join-as-expert?code=… — the founding network's door for experts and
 * studios (pilot supply gate, Option B). Each invited member gets a
 * personal, single-use invite link; this page pre-validates the code for friendly UX and renders the
 * creator signup. Real enforcement lives in the app_handle_new_user
 * trigger: without a valid code the account is never created, so the
 * public auth API cannot mint creators either.
 *
 * Public route (proxy allowlist): invitees arrive from outside while the
 * beta wall is still up. Their signup also plants the wall cookie, so an
 * invited expert never sees the wall at all.
 */

export const metadata = {
  title: "Founding network invitation · INFITRA",
  robots: { index: false, follow: false },
};

export default async function JoinAsExpertPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const trimmed = code?.trim() ?? "";
  const supabase = await createClient();

  let valid = false;
  if (trimmed) {
    const { data } = await supabase.rpc("app_validate_creator_invite", {
      p_code: trimmed,
    });
    valid = data === true;
  }

  if (!valid) {
    // Members reopen their invite link to get back in (Jutta, 31 Oct 2026):
    // the link is spent, the account is not. A signed-in member goes straight
    // home (the dashboard layout routes a card-only member on to /network);
    // everyone else gets the sign-in door first.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");

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
            This invite link is not active anymore.
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#475569" }}>
            Invites are personal and work once. If you already created your
            account with it, sign in with your email and password.
          </p>
          <Link
            href="/login"
            className="block w-full py-3.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] mb-6"
            style={{
              backgroundColor: "#FF6130",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
            }}
          >
            Sign in
          </Link>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#475569" }}>
            Never used it? Reply to the message that brought you here and we
            will send you a fresh one.
          </p>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Not invited yet?{" "}
            <Link href="/apply" className="hover:opacity-80" style={{ color: "#0891b2", fontWeight: 700 }}>
              Join the founding network →
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
