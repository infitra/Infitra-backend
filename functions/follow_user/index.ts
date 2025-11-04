// supabase/functions/follow_user/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Read env (note: cannot use SUPABASE_* prefixes for secrets set via CLI)
const SUPABASE_URL = Deno.env.get("PUBLIC_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("PUBLIC_ANON_KEY")!;

// Create a client that forwards caller's JWT so RLS is enforced
function clientWithAuth(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

Deno.serve(async (req) => {
  try {
    const supabase = clientWithAuth(req);

    // Parse JSON body
    const { followee_id } = await req.json().catch(() => ({}));
    if (!followee_id) {
      return new Response(JSON.stringify({ error: "Missing followee_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure the caller is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const follower_id = user.id;
    if (follower_id === followee_id) {
      return new Response(JSON.stringify({ error: "Cannot follow yourself" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Idempotent follow using upsert (unique on follower_id, followee_id)
    const { error: upsertError } = await supabase
      .from("app_follow")
      .upsert({ follower_id, followee_id }, { onConflict: "follower_id,followee_id", ignoreDuplicates: true });

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Optional: return quick counts from the stats view (best-effort)
    const { data: stats } = await supabase
      .from("app_profile_stats")
      .select("followers, following")
      .eq("profile_id", followee_id)
      .single();

    return new Response(
      JSON.stringify({
        message: "Follow successful",
        follower_id,
        followee_id,
        stats,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});