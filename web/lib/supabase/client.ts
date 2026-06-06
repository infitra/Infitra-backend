import { createBrowserClient } from "@supabase/ssr";

/**
 * Singleton browser Supabase client.
 *
 * Why a singleton (this matters for Realtime): the realtime socket
 * authenticates with the access token (JWT) at connect time, and supabase-js
 * pushes a refreshed token to the socket when the session refreshes (~hourly)
 * — but only for the SAME client instance. The old factory minted a NEW client
 * on every createClient() call, so on a long-lived realtime page (the
 * collaboration workspace, the Experience Space) the instance holding the open
 * channel never learned about the refreshed token. Once the original JWT
 * expired, the server stopped authorizing that socket's postgres_changes and
 * events silently stopped arriving — until a reload minted a fresh client.
 * (Multiple GoTrue instances also race to rotate the refresh token.) That's the
 * "partner stopped seeing my changes in realtime until they refreshed" report.
 *
 * One client → one socket → one refresh loop → the live channel's token stays
 * current.
 */

// Concrete (non-generic) factory so the singleton's type is the exact inline
// client type — preserves postgres_changes payload inference at call sites.
function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let browserClient: ReturnType<typeof makeClient> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = makeClient();

  // Belt-and-suspenders: explicitly propagate refreshed tokens to the realtime
  // socket so a long-open channel never authorizes with a stale JWT. Registered
  // once, on the singleton.
  browserClient.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      browserClient!.realtime.setAuth(session.access_token);
    }
  });

  return browserClient;
}
