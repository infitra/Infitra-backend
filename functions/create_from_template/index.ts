// Supabase Edge Function: create_from_template

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

Deno.serve(async (req) => {
  try {
    // 1) Auth
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    const caller = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: u, error: uErr } = await caller.auth.getUser();
    if (uErr || !u?.user) return json({ error: "Unauthorized" }, 401);

    const userId = u.user.id;

    // 2) Input
    const { template_id, overrides } = await req.json();
    if (!template_id) return json({ error: "Missing template_id" }, 400);

    // 3) Load template
    const { data: template, error: tErr } = await admin
      .from("app_template")
      .select("*")
      .eq("id", template_id)
      .single();

    if (tErr || !template) return json({ error: "Template not found" }, 404);

    // 4) Apply overrides (optional)
    const title = overrides?.title ?? template.title;
    const description = overrides?.description ?? template.description;
    const price_cents = overrides?.price_cents ?? template.price_cents;
    const capacity = overrides?.capacity ?? template.capacity;

    // -----------------------------
    // SESSION TEMPLATE
    // -----------------------------
    if (template.kind === "session") {
      const { data: session, error } = await admin
        .from("app_session")
        .insert({
          title,
          price_cents,
          currency: template.currency,
          capacity,
          host_id: userId,
          status: "draft",
          config: template.config
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);

      return json({ session_id: session.id });
    }

    // -----------------------------
    // CHALLENGE TEMPLATE
    // -----------------------------
    if (template.kind === "challenge") {
      // 1) Create challenge
      const { data: challenge, error: cErr } = await admin
        .from("app_challenge")
        .insert({
          title,
          description,
          price_cents,
          currency: template.currency,
          capacity,
          owner_id: userId,
          status: "draft",
          config: template.config
        })
        .select()
        .single();

      if (cErr) return json({ error: cErr.message }, 500);

      // 2) Load template items
      const { data: items, error: iErr } = await admin
        .from("app_template_item")
        .select("*")
        .eq("template_id", template_id)
        .order("position", { ascending: true });

      if (iErr) return json({ error: iErr.message }, 500);

      // 3) Create sessions
      for (const item of items || []) {
        if (item.item_type === "session") {
          await admin.from("app_session").insert({
            title: item.config?.title ?? "Session",
            price_cents: 0,
            currency: template.currency,
            host_id: userId,
            challenge_id: challenge.id,
            status: "draft",
            config: item.config
          });
        }
      }

      return json({ challenge_id: challenge.id });
    }

    return json({ error: "Invalid template kind" }, 400);

  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}