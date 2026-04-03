import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Skip for landing page and static assets
  if (pathname === "/") return supabaseResponse;

  // --- Unauthenticated users trying to access protected routes ---
  if (
    !user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // --- Authenticated users on auth pages → redirect away ---
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

  // --- Authenticated users who haven't onboarded ---
  if (
    user &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth")
  ) {
    // Check cookie first to avoid DB query on every request
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

      // Profile is complete — set cookie to skip future DB queries
      supabaseResponse.cookies.set("x-onboarded", "1", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
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
