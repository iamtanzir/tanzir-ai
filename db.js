/* IndexedDB Wrapper for Tanzir AI */
const DB_NAME = "TanzirAIDB";
const DB_VERSION = 1;
const STORE_NAME = "chat_storage";

async function initDB() {
  return new Promise((resolve, reject) => {
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
  const key = "evolution_" + topic.toLowerCase().trim();
  const data = { topic, correction, timestamp: Date.now() };
  await dbSet(key, data);
}

async function getEvolution(topic) {
  const key = "evolution_" + topic.toLowerCase().trim();
  return await dbGet(key);
}

async function getAllEvolutions() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const evos = request.result.filter(item => typeof item === 'object' && item.topic);
      resolve(evos);
    };
    request.onerror = () => reject(request.error);
  });
}

// Export to window for use in app.js
window.tanzirDB = { set: dbSet, get: dbGet, del: dbDel, saveEvolution, getEvolution, getAllEvolutions };
