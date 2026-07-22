import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Routes that are always public — no beta gate, no auth required.
// /apply + /pilot-terms are the outreach funnel — a creator clicking
// "Apply for the pilot" from the landing must NEVER hit the beta gate.
// /new now 308-redirects to / (next.config); kept public so the redirect
// is reachable rather than swallowed by the gate.
// The metadata routes must be reachable by social scrapers and search
// crawlers — the matcher below only excludes image extensions, so
// /sitemap.xml, /robots.txt and /opengraph-image all reach the gate.
const PUBLIC_ROUTES = [
  "/",
  "/new",
  "/apply",
  "/pilot-terms",
  "/beta-access",
  "/auth/callback",
  "/test-wave-light",
  "/sitemap.xml",
  "/robots.txt",
  "/opengraph-image",
  // Founding expert invite door — self-gated by its single-use code (the
  // signup trigger enforces it); invitees arrive while the wall is up, and
  // successful redemption plants the wall cookie for them.
  "/join-as-expert",
];

// Public prefixes — any path starting with one of these is treated
// as public (no beta gate, no auth required). Used for routes that
// have dynamic IDs and need to be shareable to anyone (including
// strangers landing from a DM/social-shared link).
//
// /experiences/ → public buyer page (Bundle 4, renamed from
// /challenges/ in the Bundle 5 legacy sweep). Creators paste this
// URL into their networks; if it requires beta access or login,
// outreach is broken. The page itself is auth-aware (Sign-in CTA
// for anonymous, Join for authenticated, Preview for the creator).
//
// The cohort space at /experiences/[id]/space also falls under this
// prefix; that page's own server component handles auth + entitlement
// (redirects anon → /login) — the proxy stays simple.
const PUBLIC_PREFIXES = ["/experiences/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and truly public routes
  if (isPublic(pathname)) {
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
    // Preserve the FULL original destination (path + query) so intent-carrying
    // links survive the gate — notably the buyer page's anonymous Join link
    // /login?intent=buy:challenge:<id>&returnTo=... Setting next to `pathname`
    // alone dropped the query, so after the code was entered the user landed on
    // a bare /login with the buy intent gone and the purchase flow dead-ended.
    // Build a clean /beta-access URL (not a clone of the original request,
    // which would also leak the original query as loose params on the gate URL).
    const url = new URL("/beta-access", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
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
      pathname.startsWith("/sessions") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/creators") ||
      pathname.startsWith("/profile") ||
      // Participant home (Bundle 4.1) — lists "My programs" with door
      // into each cohort space. Seed of the post-pilot participant
      // dashboard (analytics, achievements, active purchases).
      pathname.startsWith("/me"))
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
      // Participant home (Bundle 4.1). /discover doesn't exist yet —
      // /me is the actual landing for participants.
      url.pathname = "/me";
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
