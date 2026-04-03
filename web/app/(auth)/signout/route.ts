import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.infitra.fit")
  );

  // Clear the onboarded performance cookie so proxy re-checks on next login
  response.cookies.delete("x-onboarded");

  return response;
}
