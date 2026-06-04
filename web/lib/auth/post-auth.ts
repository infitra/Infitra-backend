import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Decide where a user lands after sign-in / sign-up.
 *
 * Bundle 4.1: the buyer-page flow sends anon users to /login with
 * two intents threaded through query params:
 *
 *   ?returnTo=/challenges/abc        — generic "come back here"
 *   ?intent=buy:challenge:abc        — "after auth, start checkout"
 *
 * `intent=buy:*` is the magic one: instead of bouncing the user back
 * to the buyer page and asking them to click Buy a second time, we
 * call create_checkout_session server-side and redirect straight to
 * Stripe. That removes the post-auth friction that's killing
 * conversion on DM-shared links.
 *
 * Falls back gracefully:
 *   - buy intent + checkout fails  → land on returnTo (or buyer page)
 *   - buy intent + no returnTo     → land on the targeted offer's page
 *   - no intent + returnTo set     → honor returnTo
 *   - neither                       → role-based default (existing behavior)
 *
 * Returns a path to redirect to. The caller does `redirect(path)`.
 */

type AppRole = "creator" | "participant" | "admin" | null | undefined;

interface ResolvePostAuthArgs {
  supabase: SupabaseClient;
  user: User;
  role: AppRole;
  /** Raw `intent` query param value, e.g. "buy:challenge:abc-123" */
  intent?: string | null;
  /** Raw `returnTo` query param value, e.g. "/challenges/abc" */
  returnTo?: string | null;
}

const ALLOWED_INTENT_KINDS = new Set(["session", "challenge"]);

function parseBuyIntent(
  intent: string | null | undefined,
): { kind: "session" | "challenge"; targetId: string } | null {
  if (!intent) return null;
  const parts = intent.split(":");
  if (parts.length !== 3 || parts[0] !== "buy") return null;
  const [, kind, targetId] = parts;
  if (!ALLOWED_INTENT_KINDS.has(kind)) return null;
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) return null;
  return { kind: kind as "session" | "challenge", targetId };
}

/**
 * Strict allow-list for returnTo paths. We never honor anything that
 * starts with `//`, `http`, or doesn't begin with `/` — those are
 * open-redirect bait. We also require it to start with one of the
 * known app prefixes so a stale or hand-crafted link can't bounce
 * an authenticated user into an arbitrary path.
 */
function sanitizeReturnTo(returnTo: string | null | undefined): string | null {
  if (!returnTo) return null;
  if (!returnTo.startsWith("/")) return null;
  if (returnTo.startsWith("//")) return null;
  if (returnTo.startsWith("/login") || returnTo.startsWith("/auth")) return null;
  const allowedPrefixes = [
    "/experiences/",
    "/dashboard",
    "/discover",
    "/sessions",
    "/creators/",
    "/profile",
    "/me",
  ];
  if (returnTo === "/") return "/";
  if (!allowedPrefixes.some((p) => returnTo.startsWith(p))) return null;
  return returnTo;
}

function roleDefault(role: AppRole): string {
  // Creators → their dashboard. Participants → /me (Bundle 4.1
  // participant home). Unknown role falls back to landing.
  if (role === "creator" || role === "admin") return "/dashboard";
  if (role === "participant") return "/me";
  return "/";
}

export async function resolvePostAuth({
  supabase,
  user,
  role,
  intent,
  returnTo,
}: ResolvePostAuthArgs): Promise<string> {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  const buy = parseBuyIntent(intent);

  // Path 1: buy intent — try to create a Stripe checkout session and
  // send the user straight to it. If anything goes wrong (already
  // purchased, capacity full, rate limited, etc.) we fall back to the
  // returnTo page (the buyer page) so they see context, not a void.
  if (buy) {
    const fallback = safeReturnTo ?? `/${buy.kind === "challenge" ? "challenges" : "sessions"}/${buy.targetId}`;

    // Edge function requires the user's JWT. supabase.functions.invoke
    // uses the SSR cookies, which contain the freshly minted session
    // from signIn/signUp.
    try {
      const { data, error } = await supabase.functions.invoke(
        "create_checkout_session",
        { body: { kind: buy.kind, target_id: buy.targetId } },
      );
      if (error) {
        // Network / 5xx — back to the buyer page; they can hit Buy again.
        return appendQuery(fallback, { checkout_error: "edge_failed" });
      }
      if (data?.error) {
        // Surface specific business errors as a query param for the
        // buyer page to read and show inline (e.g. ALREADY_PURCHASED
        // → already-purchased state; CHALLENGE_FULL → sold-out state).
        return appendQuery(fallback, { checkout_error: String(data.error) });
      }
      if (data?.checkout_url) {
        return data.checkout_url as string;
      }
      return appendQuery(fallback, { checkout_error: "no_url" });
    } catch {
      return appendQuery(fallback, { checkout_error: "exception" });
    }
  }

  // Path 2: plain returnTo — used by sign-in CTAs that don't have a
  // purchase intent yet (e.g. someone signing in to view a draft).
  if (safeReturnTo) return safeReturnTo;

  // Path 3: role-based default — existing behavior. Creators go to
  // their dashboard; participants land on the landing page (pilot has
  // no participant home yet — see Bundle 4.2 plan).
  return roleDefault(role);
}

function appendQuery(path: string, params: Record<string, string>): string {
  const hasQuery = path.includes("?");
  const sep = hasQuery ? "&" : "?";
  const qs = new URLSearchParams(params).toString();
  return `${path}${sep}${qs}`;
}
