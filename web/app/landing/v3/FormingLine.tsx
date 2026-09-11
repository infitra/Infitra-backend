import { createAnonClient } from "@/lib/supabase/anon";
import { MUTED } from "../ui";

/**
 * The forming state under "How joining works" (11 Sep 2026). Mirrors the
 * shared FoundingRow's guard exactly (fewer than three public cards), so
 * exactly one of the two renders: the row once the public reader opens,
 * this line until then. Anonymous client, so the page stays static.
 */
export async function FormingLine() {
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("load_founding_community", { p_public_only: true });
  const count = ((data?.members ?? []) as unknown[]).length;
  if (count >= 3) return null;
  return (
    <p data-forming className="text-sm text-center -mt-8 mb-12 md:-mt-12 md:mb-16" style={{ color: MUTED }}>
      The founding network is forming. Profiles appear here as their owners join.
    </p>
  );
}
