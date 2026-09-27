// --- Mux playback token server --------------------------------------------
// Tiny API that mints signed Mux playback tokens. It exists because the Mux
// signing key must never reach the browser: anyone holding it could mint
// tokens for any of our videos. Run with `npm run dev:api` (Vite proxies
// /api here during `npm run dev`).
//
// About "short-term, non-reusable" tokens — what Mux can and can't do:
//   - Short-term: yes. Each token's `exp` is set to (video duration + a
//     grace period). Mux requires exp to outlast the video, because an
//     expired token stops playback even mid-stream.
//   - Single-use: Mux has no such mode. A token is a signed JWT and plays
//     from anywhere until it expires. What we do instead:
//       1. Only this server can mint tokens, fresh per request, never cached.
//       2. Per-IP rate limiting, so tokens can't be minted in bulk.
//       3. Optional MUX_PLAYBACK_RESTRICTION_ID (a referrer allowlist set up
//          in Mux) is embedded, so a copied token won't play on other sites.
//     Put this endpoint behind real auth (e.g. a Firebase ID token check)
//     once the app has logins.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import Mux from "@mux/mux-node";

const PORT = Number(process.env.API_PORT ?? 8787);
const PLAYBACK_ID = process.env.MUX_PLAYBACK_ID;
const RESTRICTION_ID = process.env.MUX_PLAYBACK_RESTRICTION_ID || undefined;

// Extra lifetime on top of the video's duration, so pausing for a bit
// doesn't kill playback. The client re-requests tokens if they do expire.
const GRACE_SECONDS = 10 * 60;
// Used only if Mux doesn't report a duration yet.
const FALLBACK_DURATION_SECONDS = 30 * 60;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

// Reads MUX_TOKEN_ID / MUX_TOKEN_SECRET / MUX_SIGNING_KEY / MUX_PRIVATE_KEY.
const mux = new Mux();

let cachedDurationSeconds: number | undefined;

async function getVideoDurationSeconds(playbackId: string): Promise<number> {
  if (cachedDurationSeconds) return cachedDurationSeconds;
  try {
    const { object } = await mux.video.playbackIds.retrieve(playbackId);
    const asset = await mux.video.assets.retrieve(object.id);
    if (asset.duration) cachedDurationSeconds = Math.ceil(asset.duration);
  } catch (error) {
    console.warn("Couldn't look up video duration; using fallback.", error);
  }
  return cachedDurationSeconds ?? FALLBACK_DURATION_SECONDS;
}

const requestsByIp = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestsByIp.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestsByIp.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    // Tokens are per-request; never let a browser or proxy reuse one.
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function handlePlaybackToken(req: IncomingMessage, res: ServerResponse) {
  if (!PLAYBACK_ID) {
    sendJson(res, 500, { error: "MUX_PLAYBACK_ID is not set on the server." });
    return;
  }

  const ip = req.socket.remoteAddress ?? "unknown";
  if (isRateLimited(ip)) {
    sendJson(res, 429, { error: "Too many requests. Try again in a minute." });
    return;
  }

  const lifetimeSeconds = (await getVideoDurationSeconds(PLAYBACK_ID)) + GRACE_SECONDS;
  const tokens = await mux.jwt.signPlaybackId(PLAYBACK_ID, {
    // video ("v") also covers the caption/subtitle tracks.
    type: ["video", "thumbnail", "storyboard"],
    expiration: `${lifetimeSeconds}s`,
    params: RESTRICTION_ID ? { playback_restriction_id: RESTRICTION_ID } : undefined,
  });

  sendJson(res, 200, {
    playbackId: PLAYBACK_ID,
    tokens: {
      playback: tokens["playback-token"],
      thumbnail: tokens["thumbnail-token"],
      storyboard: tokens["storyboard-token"],
    },
    expiresAt: Date.now() + lifetimeSeconds * 1000,
  });
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/mux/playback-token") {
    handlePlaybackToken(req, res).catch((error: unknown) => {
      console.error("Failed to sign playback token.", error);
      sendJson(res, 500, { error: "Couldn't create a playback token." });
    });
    return;
  }

  sendJson(res, 404, { error: "Not found." });
});

server.listen(PORT, () => {
  console.log(`Mux token server listening on http://localhost:${PORT}`);
});
