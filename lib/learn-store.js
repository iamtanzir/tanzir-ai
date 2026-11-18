"use strict";

/**
 * Shared storage layer for the "Learn" (self-correction) feature.
 *
 * Two managed databases are supported, in this order:
 *   1. Turso / libSQL   — TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 *   2. Supabase Postgres — SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * A per-process in-memory store is used only when LEARN_DEV=1 (local testing).
 * Nothing here ever runs in the browser, so the service keys stay server-side.
 *
 * This module lives outside /api so Vercel does not expose it as its own
 * serverless endpoint; only api/learn.js and api/health.js are routes.
 */

const MAX_PROFILE = 64;
const MAX_TOPIC = 240;
const MAX_CORRECTION = 2000;
const MAX_LIST = 100;

function cleanText(value, max) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeProfile(value) {
  const id = String(value || "").trim().toLowerCase();
  return /^[a-z0-9_-]{8,64}$/.test(id) ? id : "";
}

function normalizeEvolution(input) {
  const topic = cleanText(input && input.topic, MAX_TOPIC);
  const correction = cleanText(input && input.correction, MAX_CORRECTION);
  if (topic.length < 2 || correction.length < 2) return null;
  return { topic, topicKey: topic.toLowerCase(), correction };
}

function backendName() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) return "turso";
  if (
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
  ) return "supabase";
  if (process.env.LEARN_DEV === "1") return "dev";
  return "";
}

/* ------------------------------ Turso / libSQL ----------------------------- */

let tursoClientPromise = null;

function getTursoClient() {
  if (!tursoClientPromise) {
    tursoClientPromise = (async () => {
      let mod;
      try {
        // Web build: pure fetch/HTTP, no native sqlite bindings. This is the
        // reliable choice inside Vercel serverless functions; `libsql://...`
        // URLs are mapped to HTTPS by the client.
        mod = await import("@libsql/client/web");
      } catch (e) {
        // Fall back to the Node build if the subpath export is unavailable.
        mod = await import("@libsql/client");
      }
      return mod.createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    })();
  }
  return tursoClientPromise;
}

async function tursoList(profileId, limit) {
  const client = await getTursoClient();
  const result = await client.execute({
    sql: "SELECT topic, correction, updated_at FROM evolutions WHERE profile_id = ? ORDER BY updated_at DESC LIMIT ?",
    args: [profileId, limit],
  });
  return result.rows
    .map((row) => ({
      topic: String(row.topic || ""),
      correction: String(row.correction || ""),
      updatedAt: Number(row.updated_at) || 0,
    }))
    .filter((row) => row.topic && row.correction);
}

async function tursoPut(profileId, evolution) {
  const now = Date.now();
  const client = await getTursoClient();
  await client.execute({
    sql: `INSERT INTO evolutions (profile_id, topic, topic_key, correction, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(profile_id, topic_key) DO UPDATE SET
            topic = excluded.topic,
            correction = excluded.correction,
            updated_at = excluded.updated_at`,
    args: [profileId, evolution.topic, evolution.topicKey, evolution.correction, now, now],
  });
  return now;
}

async function tursoRemove(profileId, topicKey) {
  const client = await getTursoClient();
  await client.execute({
    sql: "DELETE FROM evolutions WHERE profile_id = ? AND topic_key = ?",
    args: [profileId, topicKey],
  });
}

/* -------------------------------- Supabase -------------------------------- */

function supabaseConfig() {
  return {
    url: String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "",
  };
}

function supabaseHeaders(key, extra) {
  return {
    apikey: key,
    Authorization: "Bearer " + key,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

async function supabaseList(profileId, limit) {
  const { url, key } = supabaseConfig();
  const query = new URLSearchParams({
    select: "topic,correction,updated_at",
    profile_id: "eq." + profileId,
    order: "updated_at.desc",
    limit: String(limit),
  });
  const res = await fetch(url + "/rest/v1/evolutions?" + query.toString(), {
    headers: supabaseHeaders(key),
  });
  if (!res.ok) throw new Error("supabase_http_" + res.status);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      topic: String(row.topic || ""),
      correction: String(row.correction || ""),
      updatedAt: Date.parse(row.updated_at) || 0,
    }))
    .filter((row) => row.topic && row.correction);
}

async function supabasePut(profileId, evolution) {
  const { url, key } = supabaseConfig();
  const now = new Date().toISOString();
  const res = await fetch(url + "/rest/v1/evolutions?on_conflict=profile_id,topic_key", {
    method: "POST",
    headers: supabaseHeaders(key, {
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify([
      {
        profile_id: profileId,
        topic: evolution.topic,
        topic_key: evolution.topicKey,
        correction: evolution.correction,
        updated_at: now,
      },
    ]),
  });
  if (!res.ok) throw new Error("supabase_http_" + res.status);
  return Date.parse(now) || Date.now();
}

async function supabaseRemove(profileId, topicKey) {
  const { url, key } = supabaseConfig();
  const query = new URLSearchParams({
    profile_id: "eq." + profileId,
    topic_key: "eq." + topicKey,
  });
  const res = await fetch(url + "/rest/v1/evolutions?" + query.toString(), {
    method: "DELETE",
    headers: supabaseHeaders(key, { Prefer: "return=minimal" }),
  });
  if (!res.ok) throw new Error("supabase_http_" + res.status);
}

/* ------------------------------ Dev in-memory ----------------------------- */

const devStore = new Map();

function devBucket(profileId) {
  if (!devStore.has(profileId)) devStore.set(profileId, new Map());
  return devStore.get(profileId);
}

async function devList(profileId, limit) {
  return Array.from(devBucket(profileId).values())
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

async function devPut(profileId, evolution) {
  const now = Date.now();
  devBucket(profileId).set(evolution.topicKey, {
    topic: evolution.topic,
    correction: evolution.correction,
    updatedAt: now,
  });
  return now;
}

async function devRemove(profileId, topicKey) {
  devBucket(profileId).delete(topicKey);
}

/* -------------------------------- Facade ---------------------------------- */

async function listEvolutions(profileId, limit) {
  const backend = backendName();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), MAX_LIST);
  if (backend === "turso") return tursoList(profileId, safeLimit);
  if (backend === "supabase") return supabaseList(profileId, safeLimit);
  if (backend === "dev") return devList(profileId, safeLimit);
  throw new Error("learn_storage_not_configured");
}

async function putEvolution(profileId, evolution) {
  const backend = backendName();
  if (backend === "turso") return tursoPut(profileId, evolution);
  if (backend === "supabase") return supabasePut(profileId, evolution);
  if (backend === "dev") return devPut(profileId, evolution);
  throw new Error("learn_storage_not_configured");
}

async function removeEvolution(profileId, topicKey) {
  const backend = backendName();
  if (backend === "turso") return tursoRemove(profileId, topicKey);
  if (backend === "supabase") return supabaseRemove(profileId, topicKey);
  if (backend === "dev") return devRemove(profileId, topicKey);
  throw new Error("learn_storage_not_configured");
}

module.exports = {
  MAX_LIST,
  backendName,
  cleanText,
  normalizeProfile,
  normalizeEvolution,
  listEvolutions,
  putEvolution,
  removeEvolution,
};
