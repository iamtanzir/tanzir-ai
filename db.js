/* IndexedDB Wrapper for Tanzir AI
 *
 * Local-first: chats and "Learn" corrections always work with no network and
 * no account. When the app is deployed on Vercel with a database configured
 * (Turso or Supabase, see api/learn.js), learned corrections are also synced
 * to the cloud so the same profile keeps improving across devices/reloads.
 */
const DB_NAME = "TanzirAIDB";
const DB_VERSION = 1;
const STORE_NAME = "chat_storage";

const EVOLUTION_PREFIX = "evolution_";
const LEARN_ENDPOINT = "/api/learn";
const LEARN_HEALTH_ENDPOINT = "/api/health";
const LEARN_RECHECK_MS = 5 * 60 * 1000;
const LEARN_TIMEOUT_MS = 4500;
const MAX_TOPIC = 240;
const MAX_CORRECTION = 2000;
const MAX_EVOLUTIONS = 200;

let dbPromise = null;
let learnMode = "unknown"; // "unknown" | "on" | "off"
let learnBackend = "";
let learnCheckedAt = 0;

async function initDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = request.error;
        const errorMsg = error ? error.message || error.name || "Unknown IndexedDB error" : "IndexedDB initialization failed";
        reject(new Error(errorMsg));
      };
    });
  }
  return dbPromise;
}

async function dbSet(key, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      const error = request.error;
      const errorMsg = error ? error.message || error.name || "Unknown database write error" : "Database write failed";
      reject(new Error(errorMsg));
    };
  });
}

async function dbGet(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      const error = request.error;
      const errorMsg = error ? error.message || error.name || "Unknown database read error" : "Database read failed";
      reject(new Error(errorMsg));
    };
  });
}

async function dbDel(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      const error = request.error;
      const errorMsg = error ? error.message || error.name || "Unknown database delete error" : "Database delete failed";
      reject(new Error(errorMsg));
    };
  });
}

/* ------------------------- Learn / self-corrections ------------------------ */

function cleanEvolutionText(value, max) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeTopic(topic) {
  return cleanEvolutionText(topic, MAX_TOPIC);
}

function normalizeCorrection(correction) {
  return cleanEvolutionText(correction, MAX_CORRECTION);
}

function evolutionKey(topic) {
  // Keep the original key format so previously saved evolutions still resolve.
  // IndexedDB keys are plain strings and accept Unicode, so Bengali topics must
  // NOT be stripped to ASCII (that collapsed every Bengali topic to underscores).
  return EVOLUTION_PREFIX + normalizeTopic(topic).toLowerCase();
}

function byTimestamp(a, b) {
  return (Number(a && a.timestamp) || 0) - (Number(b && b.timestamp) || 0);
}

async function fetchJson(url, options) {
  if (typeof fetch !== "function") throw new Error("fetch is not available");
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), LEARN_TIMEOUT_MS) : null;
  try {
    const res = await fetch(url, {
      ...(options || {}),
      cache: "no-store",
      credentials: "same-origin",
      signal: controller ? controller.signal : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { res, data };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Ask /api/health whether cloud sync is available. Cached for 5 minutes so a
 * static/GitHub-Pages deployment only pays one cheap 404 per session.
 */
async function detectLearnBackend(force) {
  const fresh = learnMode !== "unknown" && Date.now() - learnCheckedAt < LEARN_RECHECK_MS;
  if (!force && fresh) return learnMode === "on";
  try {
    const { res, data } = await fetchJson(LEARN_HEALTH_ENDPOINT, { method: "GET" });
    const info = data && data.learn;
    learnMode = res.ok && info && info.enabled ? "on" : "off";
    learnBackend = (info && info.backend) || "";
  } catch (e) {
    learnMode = "off";
    learnBackend = "";
  }
  learnCheckedAt = Date.now();
  return learnMode === "on";
}

function getLearnStatus() {
  return { mode: learnMode, backend: learnBackend, enabled: learnMode === "on" };
}

/**
 * Save a correction. Local write is always attempted first; the cloud write is
 * best-effort. Succeeds when at least one of the two worked.
 */
async function saveEvolution(topic, correction, profileId) {
  const cleanTopic = normalizeTopic(topic);
  const cleanCorrection = normalizeCorrection(correction);
  if (!cleanTopic || !cleanCorrection) {
    throw new Error("topic and correction must not be empty");
  }
  const data = {
    topic: cleanTopic,
    correction: cleanCorrection,
    timestamp: Date.now(),
  };
  if (profileId) data.profileId = profileId;

  let local = false;
  let remote = false;
  let localError = null;
  try {
    await dbSet(evolutionKey(cleanTopic), data);
    local = true;
  } catch (e) {
    localError = e;
  }

  if (profileId && (await detectLearnBackend())) {
    try {
      const { res } = await fetchJson(LEARN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, topic: cleanTopic, correction: cleanCorrection }),
      });
      remote = res.ok;
      if (!remote && res.status === 503) learnMode = "off";
    } catch (e) {
      // Offline / static hosting: local copy is still saved.
    }
  }

  if (!local && !remote) {
    throw localError || new Error("Could not save the correction");
  }
  return { local, remote, timestamp: data.timestamp };
}

async function readAllEvolutionRecords() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const evos = request.result.filter(
        (item) => item && typeof item === "object" && item.topic && item.correction
      );
      resolve(evos);
    };
    request.onerror = () => {
      const error = request.error;
      const errorMsg = error ? error.message || error.name || "Unknown database read error" : "Database read failed";
      reject(new Error(errorMsg));
    };
  });
}

/**
 * Local corrections for a profile. Records saved before profile scoping existed
 * are claimed by the first profile that loads (they belong to this browser),
 * so they cannot leak to a different provider/API-key profile later.
 */
async function getAllEvolutions(profileId) {
  const evos = await readAllEvolutionRecords();
  if (!profileId) return evos.sort(byTimestamp);

  const claimed = [];
  for (const item of evos) {
    if (!item.profileId) {
      item.profileId = profileId;
      claimed.push(item);
      try { await dbSet(evolutionKey(item.topic), item); } catch (e) {}
    }
  }
  return evos
    .filter((item) => item.profileId === profileId)
    .sort(byTimestamp);
}

async function mergeEvolutionLists(local, remote, profileId) {
  const keyOf = (topic) => normalizeTopic(topic).toLowerCase();
  const localMap = new Map();
  local.forEach((item) => {
    if (item && item.topic && item.correction) localMap.set(keyOf(item.topic), item);
  });

  const merged = new Map(localMap);
  (remote || []).forEach((row) => {
    const topic = normalizeTopic(row && row.topic);
    const correction = normalizeCorrection(row && row.correction);
    if (!topic || !correction) return;
    const key = keyOf(topic);
    const previous = merged.get(key);
    const remoteTs = Number(row.updatedAt) || 0;
    if (!previous || remoteTs >= (Number(previous.timestamp) || 0)) {
      merged.set(key, { topic, correction, timestamp: remoteTs || Date.now(), profileId });
    }
  });

  const list = Array.from(merged.values()).sort(byTimestamp).slice(-MAX_EVOLUTIONS);

  // Persist only what actually changed locally.
  for (const item of list) {
    const key = keyOf(item.topic);
    const previous = localMap.get(key);
    const changed =
      !previous ||
      previous.correction !== item.correction ||
      previous.profileId !== item.profileId;
    if (changed) {
      try { await dbSet(evolutionKey(item.topic), item); } catch (e) {}
    }
  }
  return list;
}

/**
 * Local list merged with the cloud list for this profile. Never throws: any
 * network/hosting problem simply returns the local corrections.
 */
async function syncEvolutions(profileId) {
  let local = [];
  try {
    local = await getAllEvolutions(profileId);
  } catch (e) {
    local = [];
  }
  if (!profileId || !(await detectLearnBackend())) return local;

  try {
    const { res, data } = await fetchJson(
      LEARN_ENDPOINT + "?profileId=" + encodeURIComponent(profileId) + "&limit=100",
      { method: "GET" }
    );
    if (!res.ok || !data || data.enabled === false) {
      if (res.status === 503) learnMode = "off";
      return local;
    }
    const remote = Array.isArray(data.evolutions) ? data.evolutions : [];
    if (data.backend) learnBackend = data.backend;
    return await mergeEvolutionLists(local, remote, profileId);
  } catch (e) {
    return local;
  }
}

// Additional helper function for graceful error handling
async function gracefulDBOperation(operationName, operationFunc) {
  try {
    return await operationFunc();
  } catch (error) {
    throw new Error(`Database operation "${operationName}" failed: ${error.message || error.name || "Unknown error"}`);
  }
}

// Export to window for use in app.js
window.tanzirDB = window.tanzirDB || {
  set: dbSet,
  get: dbGet,
  del: dbDel,
  saveEvolution,
  getEvolution: async (topic, profileId) => {
    if (!topic || !topic.trim()) throw new Error("topic must not be empty");
    return await dbGet(evolutionKey(topic));
  },
  getAllEvolutions,
  syncEvolutions,
  getLearnStatus,
  detectLearnBackend,
  gracefulDBOperation,
};
