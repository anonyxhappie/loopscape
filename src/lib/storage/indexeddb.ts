/**
 * IndexedDB persistence for user collections.
 * Fallbacks gracefully if IndexedDB is blocked or unavailable in private browsing.
 */

export type UserCollection = {
  id: string;
  name: string;
  description: string;
  loopIds: string[];
  createdAt: string;
  updatedAt: string;
};

const DB_NAME = "loopscape_db";
const DB_VERSION = 1;
const STORE_NAME = "collections";

let memoryFallback: Map<string, UserCollection> = new Map();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCollections(): Promise<UserCollection[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as UserCollection[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB unavailable, falling back to memory:", err);
    return Array.from(memoryFallback.values());
  }
}

export async function getCollectionById(id: string): Promise<UserCollection | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as UserCollection) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return memoryFallback.get(id) || null;
  }
}

export async function saveCollection(collection: UserCollection): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(collection);

      req.onsuccess = () => {
        memoryFallback.set(collection.id, collection);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    memoryFallback.set(collection.id, collection);
  }
}

export async function deleteCollection(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        memoryFallback.delete(id);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    memoryFallback.delete(id);
  }
}

export async function addLoopToCollection(collectionId: string, loopId: string): Promise<UserCollection | null> {
  const col = await getCollectionById(collectionId);
  if (!col) return null;
  if (!col.loopIds.includes(loopId)) {
    col.loopIds.push(loopId);
    col.updatedAt = new Date().toISOString();
    await saveCollection(col);
  }
  return col;
}

export async function removeLoopFromCollection(collectionId: string, loopId: string): Promise<UserCollection | null> {
  const col = await getCollectionById(collectionId);
  if (!col) return null;
  col.loopIds = col.loopIds.filter((id) => id !== loopId);
  col.updatedAt = new Date().toISOString();
  await saveCollection(col);
  return col;
}
