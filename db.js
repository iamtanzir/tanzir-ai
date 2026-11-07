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

// NEW: Evolution/Learning Functions
function evolutionKey(topic) {
  // Keep the original key format so previously saved evolutions still resolve.
  // IndexedDB keys are plain strings and accept Unicode, so Bengali topics must
  // NOT be stripped to ASCII (that collapsed every Bengali topic to underscores).
  return "evolution_" + topic.trim().toLowerCase();
}

async function saveEvolution(topic, correction) {
  if (!topic || !topic.trim()) {
    throw new Error("topic must not be empty");
  }
  const key = evolutionKey(topic);
  const data = { topic, correction, timestamp: Date.now() };
  try {
    await dbSet(key, data);
  } catch (e) {
    throw new Error(`Failed to save evolution for topic "${topic}": ${e.message}`);
  }
}

async function getEvolution(topic) {
  if (!topic || !topic.trim()) {
    throw new Error("topic must not be empty");
  }
  return await dbGet(evolutionKey(topic));
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
    request.onerror = () => {
      const error = request.error;
      const errorMsg = error ? error.message || error.name || "Unknown database read error" : "Database read failed";
      reject(new Error(errorMsg));
    };
  });
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
  getEvolution,
  getAllEvolutions,
  gracefulDBOperation,
};
