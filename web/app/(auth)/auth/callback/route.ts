import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePostAuth } from "@/lib/auth/post-auth";

/**
 * Supabase email-confirm landing route.
 *
 * Bundle 4.1: also honors `intent=buy:*` + `returnTo` so a participant
 * who signs up via the buyer page can be sent straight to Stripe
 * checkout the moment they click the confirm email. Mirrors the
 * post-auth helper used by signIn/signUp server actions.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent");
  const returnTo = searchParams.get("returnTo");
  // Legacy `next` param kept as a fallback for older callbacks.
  const legacyNext = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Resolve the role so the post-auth fallback picks the right home.
  const { data: profile } = await supabase
    .from("app_profile")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const dest = await resolvePostAuth({
    supabase,
    user: data.user,
    role: (profile?.role as "creator" | "participant" | "admin" | null) ?? null,
    intent,
    returnTo: returnTo ?? legacyNext ?? null,
  });

  // resolvePostAuth returns absolute (Stripe) URLs as-is, otherwise
  // app-relative paths — normalize so NextResponse.redirect always
  // receives a fully-qualified URL.
  const redirectUrl = dest.startsWith("http") ? dest : `${origin}${dest}`;
  return NextResponse.redirect(redirectUrl);
}
