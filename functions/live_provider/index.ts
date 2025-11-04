/**
 * live_provider.ts
 * Unified live-stream provider adapter (Daily implementation)
 *
 * Exported:
 *  - provider()
 *  - createRoom(title)
 *  - issueToken(roomId, userName)
 *  - parseWebhook(req, payload)
 *
 * Required env (Daily):
 *  - LIVE_PROVIDER = "daily"
 *  - DAILY_API_BASE
 *  - DAILY_API_KEY
 */

const ACTIVE = (Deno.env.get("LIVE_PROVIDER") ?? "daily").toLowerCase();

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function provider(): string {
  return ACTIVE;
}

export async function createRoom(title: string) {
  if (ACTIVE === "daily") {
    const DAILY_API_BASE = requireEnv("DAILY_API_BASE");
    const DAILY_API_KEY  = requireEnv("DAILY_API_KEY");

    const res = await fetch(`${DAILY_API_BASE}/rooms`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        privacy: "private",
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        },
      }),
    });

    if (!res.ok) throw new Error(`Daily createRoom failed: ${await res.text()}`);
    const json = await res.json();
    const roomId = json?.name;
    if (!roomId) throw new Error("Daily createRoom: missing 'name' in response");
    return { provider: "daily", roomId };
  }

  throw new Error(`Unsupported LIVE_PROVIDER: ${ACTIVE}`);
}

export async function issueToken(roomId: string, userName: string) {
  if (ACTIVE === "daily") {
    const DAILY_API_BASE = requireEnv("DAILY_API_BASE");
    const DAILY_API_KEY  = requireEnv("DAILY_API_KEY");

    const res = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { room_name: roomId, user_name: userName },
      }),
    });

    if (!res.ok) throw new Error(`Daily issueToken failed: ${await res.text()}`);
    const json = await res.json();
    const token = json?.token;
    if (!token) throw new Error("Daily issueToken: missing 'token' in response");
    return { provider: "daily", token };
  }

  throw new Error(`Unsupported LIVE_PROVIDER: ${ACTIVE}`);
}

export function parseWebhook(_req: Request, payload: any) {
  if (ACTIVE === "daily") {
    const eventName = String(payload?.event ?? payload?.type ?? "unknown").toLowerCase();
    const roomName  = payload?.room_name ?? payload?.data?.room_name ?? null;
    const isEnded =
      eventName === "ended" ||
      eventName.includes("meeting-ended") ||
      eventName.includes("room-ended");

    return { provider: "daily", eventName, roomName, isEnded };
  }

  return { provider: ACTIVE, eventName: "unknown", roomName: null, isEnded: false };
}