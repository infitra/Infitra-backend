// Supabase Edge Function: create_from_template

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function combineDateAndTime(dateStr: string, timeOfDay: string): string {
  const safeTime =
    typeof timeOfDay === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(timeOfDay)
      ? timeOfDay
      : "18:00:00";

  const normalizedTime = safeTime.length === 5 ? `${safeTime}:00` : safeTime;
  return `${dateStr}T${normalizedTime}.000Z`;
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    const caller = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: u, error: uErr } = await caller.auth.getUser();
    if (uErr || !u?.user) return json({ error: "Unauthorized" }, 401);

    const userId = u.user.id;

    const { template_id, overrides } = await req.json();
    if (!template_id) return json({ error: "Missing template_id" }, 400);

    const { data: template, error: tErr } = await admin
      .from("app_template")
      .select("*")
      .eq("id", template_id)
      .single();

    if (tErr || !template) return json({ error: "Template not found" }, 404);

    const title = overrides?.title ?? template.title;
    const description = overrides?.description ?? template.description;
    const price_cents = overrides?.price_cents ?? template.price_cents;
    const capacity = overrides?.capacity ?? template.capacity;
    const config = overrides?.config ?? template.config ?? {};

    // -----------------------------
    // SESSION TEMPLATE
    // -----------------------------
    if (template.kind === "session") {
      const sessionConfig = config ?? {};

      const durationMinutes =
        typeof sessionConfig.duration_minutes === "number"
          ? sessionConfig.duration_minutes
          : 60;

      const startTime =
        typeof overrides?.start_time === "string"
          ? overrides.start_time
          : typeof sessionConfig.start_time === "string"
            ? sessionConfig.start_time
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: session, error } = await admin
        .from("app_session")
        .insert({
          title,
          description,
          start_time: startTime,
          duration_minutes: durationMinutes,
          price_cents,
          currency: template.currency,
          capacity,
          host_id: userId,
          status: "draft",
          config: sessionConfig,
        })
        .select("id")
        .single();

      if (error) return json({ error: error.message }, 500);

      return json({ session_id: session.id });
    }

    // -----------------------------
    // CHALLENGE TEMPLATE
    // -----------------------------
    if (template.kind === "challenge") {
      const challengeConfig = config ?? {};

      const startDate =
        typeof overrides?.start_date === "string"
          ? overrides.start_date
          : typeof challengeConfig.start_date === "string"
            ? challengeConfig.start_date
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const endDate =
        typeof overrides?.end_date === "string"
          ? overrides.end_date
          : typeof challengeConfig.end_date === "string"
            ? challengeConfig.end_date
            : addDays(startDate, 7);

      const { data: challenge, error: cErr } = await admin
        .from("app_challenge")
        .insert({
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          price_cents,
          currency: template.currency,
          capacity,
          owner_id: userId,
          status: "draft",
          config: challengeConfig,
        })
        .select("id")
        .single();

      if (cErr) return json({ error: cErr.message }, 500);

      const { data: items, error: iErr } = await admin
        .from("app_template_item")
        .select("*")
        .eq("template_id", template_id)
        .order("position", { ascending: true });

      if (iErr) return json({ error: iErr.message }, 500);

      const createdSessionIds: string[] = [];

      for (const item of items || []) {
        if (item.item_type !== "session") continue;

        const itemConfig = item.config ?? {};

        const sessionTitle =
          typeof itemConfig.title === "string" && itemConfig.title.trim() !== ""
            ? itemConfig.title
            : "Session";

        const sessionDescription =
          typeof itemConfig.description === "string"
            ? itemConfig.description
            : null;

        const sessionDuration =
          typeof itemConfig.duration_minutes === "number"
            ? itemConfig.duration_minutes
            : 60;

        const dayOffset =
          typeof itemConfig.day_offset === "number"
            ? itemConfig.day_offset
            : 0;

        const timeOfDay =
          typeof itemConfig.time_of_day === "string"
            ? itemConfig.time_of_day
            : "18:00:00";

        const sessionStartDate = addDays(startDate, dayOffset);
        const sessionStartTime = combineDateAndTime(sessionStartDate, timeOfDay);

        const sessionPrice =
          typeof itemConfig.price_cents === "number"
            ? itemConfig.price_cents
            : 0;

        const sessionCapacity =
          typeof itemConfig.capacity === "number"
            ? itemConfig.capacity
            : null;

        const { data: session, error: sErr } = await admin
          .from("app_session")
          .insert({
            title: sessionTitle,
            description: sessionDescription,
            start_time: sessionStartTime,
            duration_minutes: sessionDuration,
            price_cents: sessionPrice,
            currency: template.currency,
            capacity: sessionCapacity,
            host_id: userId,
            status: "draft",
            config: itemConfig,
          })
          .select("id")
          .single();

        if (sErr) return json({ error: sErr.message }, 500);

        const { error: linkErr } = await admin.rpc("challenge_add_session", {
          p_challenge: challenge.id,
          p_session: session.id,
        });

        if (linkErr) return json({ error: linkErr.message }, 500);

        createdSessionIds.push(session.id);
      }

      return json({
        challenge_id: challenge.id,
        session_ids: createdSessionIds,
      });
    }

    return json({ error: "Invalid template kind" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});