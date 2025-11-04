// supabase/functions/unfollow_user/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PUBLIC_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("PUBLIC_ANON_KEY")!;

function clientWithAuth(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

Deno.serve(async (req) => {
  try {
    const supabase = clientWithAuth(req);

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

    const { error: deleteError } = await supabase
      .from("app_follow")
      .delete()
      .eq("follower_id", follower_id)
      .eq("followee_id", followee_id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: stats } = await supabase
      .from("app_profile_stats")
      .select("followers, following")
      .eq("profile_id", followee_id)
      .single();

    return new Response(
      JSON.stringify({
        message: "Unfollow successful",
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