import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A cookie-free anonymous client for public server reads (6 Sep 2026).
 *
 * The cookie-backed client in ./server opts a page into dynamic rendering.
 * The landing page is static and must stay that way (bandwidth and
 * function-seconds are the meters that matter on the host), so surfaces that
 * only need anon-readable data, like the founding-community list, read
 * through this client and revalidate on a timer instead.
 */
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
