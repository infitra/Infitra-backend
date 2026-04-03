import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Routes that are always public — no beta gate, no auth required
const PUBLIC_ROUTES = ["/", "/beta-access", "/auth/callback", "/signout"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and truly public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Skip auth token refresh for prefetch requests.
  // Prefetch can consume the refresh token before the real navigation,
  // and browsers may not apply Set-Cookie headers from prefetch responses.
  if (
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch") !== null
  ) {
    return NextResponse.next();
  }

  // ── BETA GATE ─────────────────────────────────────────────────
  // Every route except public ones requires the beta access cookie.
  const betaCookie = request.cookies.get("x-beta-access")?.value;
  const validCode = process.env.BETA_ACCESS_CODE;

  if (!betaCookie || betaCookie !== validCode) {
    const url = request.nextUrl.clone();
    url.pathname = "/beta-access";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ── AUTH REFRESH + ROUTE PROTECTION ───────────────────────────
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Unauthenticated users trying to access protected app routes
  if (
    !user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/discover") ||
      pathname.startsWith("/sessions"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users landing on /login → redirect to their home
  if (user && pathname.startsWith("/login")) {
    const { data: profile } = await supabase
      .from("app_profile")
      .select("role, display_name")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (!profile?.display_name) {
      url.pathname = "/onboarding";
    } else if (profile.role === "creator" || profile.role === "admin") {
      url.pathname = "/dashboard";
    } else {
      url.pathname = "/discover";
    }
    return NextResponse.redirect(url);
  }

  // Authenticated users who haven't completed onboarding
  if (
    user &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth")
  ) {
    const onboarded = request.cookies.get("x-onboarded")?.value;
    if (!onboarded) {
      const { data: profile } = await supabase
        .from("app_profile")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (!profile?.display_name) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      // Mark as onboarded to skip future DB checks
      supabaseResponse.cookies.set("x-onboarded", "1", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
