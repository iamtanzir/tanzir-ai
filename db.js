/* IndexedDB Wrapper for Tanzir AI */
const DB_NAME = "TanzirAIDB";
const DB_VERSION = 1;
const STORE_NAME = "chat_storage";

let dbPromise = null;

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
      request.onerror = () => reject(request.error);
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
    request.onerror = () => reject(request.error);
  });
}

async function dbGet(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbDel(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// NEW: Evolution/Learning Functions
async function saveEvolution(topic, correction) {
  if (!topic || !topic.trim()) {
    throw new Error("topic must not be empty");
  }
  // sanitize key to avoid invalid IndexedDB keys
  const safeTopic = topic.trim().replace(/[^a-z0-9]/gi, "_");
  const key = "evolution_" + safeTopic;
  const data = { topic, correction, timestamp: Date.now() };
  try {
    await dbSet(key, data);
  } catch (e) {
    // re‑throw with context
    throw new Error(`Failed to save evolution for topic "${topic}": ${e.message}`);
  }
}

async function getEvolution(topic) {
  if (!topic || !topic.trim()) {
    throw new Error("topic must not be empty");
  }
  const safeTopic = topic.trim().replace(/[^a-z0-9]/gi, "_");
  const key = "evolution_" + safeTopic;
  return await dbGet(key);
}

async function getAllEvolutions() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const evos = request.result.filter(
        (item) => item && typeof item === "object" && "topic" in item
      );
      resolve(evos);
    };
    request.onerror = () => reject(request.error);
  });
}

// Export to window for use in app.js
window.tanzirDB = window.tanzirDB || {
  set: dbSet,
  get: dbGet,
  del: dbDel,
  saveEvolution,
  getEvolution,
  getAllEvolutions,
};