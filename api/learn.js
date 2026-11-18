"use strict";

/**
 * /api/learn — server-side store for the "Learn" self-corrections.
 *
 * GET    /api/learn?profileId=<id>&limit=50
 * POST   /api/learn   { profileId, topic, correction }
 * DELETE /api/learn   { profileId, topic }   (or ?profileId=&topic=)
 *
 * The profile id is a 16-hex hash of (browser id + provider + API key) made in
 * the browser. The raw key never leaves the device. When no database is
 * configured the endpoint answers 503 { enabled:false } and the app quietly
 * keeps everything in IndexedDB, so local-only / GitHub Pages stays working.
 */

const {
  MAX_LIST,
  backendName,
  cleanText,
  normalizeProfile,
  normalizeEvolution,
  listEvolutions,
  putEvolution,
  removeEvolution,
} = require("../lib/learn-store");

const MAX_BODY = 32 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 120;
const rateBuckets = new Map();

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || (req.socket && req.socket.remoteAddress) || "unknown";
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = clientIp(req);
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.reset < now) {
    rateBuckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    if (rateBuckets.size > 5000) {
      for (const [key, value] of rateBuckets) {
        if (value.reset < now) rateBuckets.delete(key);
      }
    }
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("body_too_large");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  const backend = backendName();
  if (!backend) {
    return sendJson(res, 503, {
      enabled: false,
      reason: "not-configured",
      hint: "Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
    });
  }
  if (isRateLimited(req)) {
    return sendJson(res, 429, { enabled: true, backend, error: "rate-limited" });
  }

  const method = String(req.method || "GET").toUpperCase();
  let url;
  try {
    url = new URL(req.url || "/", "http://localhost");
  } catch (e) {
    return sendJson(res, 400, { enabled: true, backend, error: "bad-url" });
  }

  try {
    if (method === "GET") {
      const profileId = normalizeProfile(url.searchParams.get("profileId"));
      if (!profileId) return sendJson(res, 400, { enabled: true, backend, error: "bad-profile" });
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), MAX_LIST);
      const evolutions = await listEvolutions(profileId, limit);
      return sendJson(res, 200, { enabled: true, backend, evolutions });
    }

    if (method === "POST") {
      const body = await readJson(req);
      const profileId = normalizeProfile(body.profileId);
      if (!profileId) return sendJson(res, 400, { enabled: true, backend, error: "bad-profile" });
      const evolution = normalizeEvolution(body);
      if (!evolution) return sendJson(res, 400, { enabled: true, backend, error: "bad-evolution" });
      const updatedAt = await putEvolution(profileId, evolution);
      return sendJson(res, 200, {
        enabled: true,
        backend,
        saved: true,
        topic: evolution.topic,
        updatedAt,
      });
    }

    if (method === "DELETE") {
      let body = {};
      try {
        body = await readJson(req);
      } catch (e) {
        body = {};
      }
      const profileId = normalizeProfile(body.profileId || url.searchParams.get("profileId"));
      const topic = cleanText(body.topic || url.searchParams.get("topic"), 240);
      if (!profileId) return sendJson(res, 400, { enabled: true, backend, error: "bad-profile" });
      if (!topic) return sendJson(res, 400, { enabled: true, backend, error: "bad-topic" });
      await removeEvolution(profileId, topic.toLowerCase());
      return sendJson(res, 200, { enabled: true, backend, deleted: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return sendJson(res, 405, { enabled: true, backend, error: "method-not-allowed" });
  } catch (error) {
    const reason =
      error && error.message === "body_too_large"
        ? "body-too-large"
        : error && /^supabase_http_/.test(error.message)
          ? error.message
          : "storage-error";
    return sendJson(res, reason === "body-too-large" ? 413 : 502, {
      enabled: true,
      backend,
      error: reason,
    });
  }
};
