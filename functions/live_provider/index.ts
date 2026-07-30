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

/** Room lifetime for a session: joinable from creation until the session's
 *  scheduled end plus an overrun buffer. The old fixed windows were both
 *  wrong in production: created+1h blocked late joiners of any session that
 *  started more than an hour after room creation, and precreate's created+3h
 *  ejected everyone from long sessions at an arbitrary moment. */
export function sessionRoomExp(startTime: string | Date, durationMinutes: number | null): number {
  const start = new Date(startTime).getTime();
  const durationMs = Math.max(durationMinutes ?? 60, 15) * 60 * 1000;
  const bufferMs = 60 * 60 * 1000; // overrun allowance
  return Math.floor((start + durationMs + bufferMs) / 1000);
}

export async function createRoom(title: string, opts?: { expUnix?: number }) {
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
        // ALWAYS private: entry only via issued meeting token. A public room
        // would let anyone who sees the room URL strip the token and share a
        // joinable link — the exact drift precreate_rooms had before it was
        // unified onto this adapter.
        privacy: "private",
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          // eject at expiry: the room self-cleans instead of lingering as a
          // joinable-forever artifact on the Daily account.
          eject_at_room_exp: true,
          exp: opts?.expUnix ?? Math.floor(Date.now() / 1000) + 2 * 60 * 60,
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