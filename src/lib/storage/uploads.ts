/**
 * IndexedDB storage for user-uploaded GIF-sized videos and loops.
 * 100% browser-local persistence.
 */
import type { LoopItem } from "@/types/catalogue";

export type UserUpload = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  mood: string;
  tags: string[];
  creator: string;
  license: string;
  duration_seconds: number;
  width: number;
  height: number;
  aspect_ratio: number;
  posterDataUrl: string; // JPEG data URL of frame 1
  mediaBlob: Blob; // Original MP4 / WebM / GIF blob
  mediaType: string; // MIME type
  bytes: number;
  uploadedAt: string;
};

const DB_NAME = "loopscape_db";
const DB_VERSION = 2; // Incremented to add user_uploads store
const COLLECTIONS_STORE = "collections";
const UPLOADS_STORE = "user_uploads";

let memoryUploadsFallback: Map<string, UserUpload> = new Map();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(COLLECTIONS_STORE)) {
        db.createObjectStore(COLLECTIONS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(UPLOADS_STORE)) {
        const uploadStore = db.createObjectStore(UPLOADS_STORE, { keyPath: "id" });
        uploadStore.createIndex("slug", "slug", { unique: false });
        uploadStore.createIndex("uploadedAt", "uploadedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveUserUpload(upload: UserUpload): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOADS_STORE, "readwrite");
      const store = tx.objectStore(UPLOADS_STORE);
      const req = store.put(upload);

      req.onsuccess = () => {
        memoryUploadsFallback.set(upload.id, upload);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("loopscape:upload", { detail: upload }));
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    if (typeof window !== "undefined" && "indexedDB" in window) {
      console.warn("IndexedDB save failed, using memory fallback:", err);
    }
    memoryUploadsFallback.set(upload.id, upload);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("loopscape:upload", { detail: upload }));
    }
  }
}

export async function getAllUserUploads(): Promise<UserUpload[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOADS_STORE, "readonly");
      const store = tx.objectStore(UPLOADS_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as UserUpload[]) || [];
        // Sort newest first
        results.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    if (typeof window !== "undefined" && "indexedDB" in window) {
      console.warn("IndexedDB read failed, using memory fallback:", err);
    }
    return Array.from(memoryUploadsFallback.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
  }
}

export async function getUserUploadById(id: string): Promise<UserUpload | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOADS_STORE, "readonly");
      const store = tx.objectStore(UPLOADS_STORE);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as UserUpload) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return memoryUploadsFallback.get(id) || null;
  }
}

export async function getUserUploadBySlug(slug: string): Promise<UserUpload | null> {
  const all = await getAllUserUploads();
  return all.find((u) => u.slug === slug || u.id === slug) || null;
}

export async function deleteUserUpload(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOADS_STORE, "readwrite");
      const store = tx.objectStore(UPLOADS_STORE);
      const req = store.delete(id);

      req.onsuccess = () => {
        memoryUploadsFallback.delete(id);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("loopscape:upload-deleted", { detail: id }));
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    memoryUploadsFallback.delete(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("loopscape:upload-deleted", { detail: id }));
    }
  }
}

// Map UserUpload to standard LoopItem so it can be passed to LoopCard and LoopViewer
export function userUploadToLoopItem(upload: UserUpload): LoopItem {
  let mediaUrl = "";
  try {
    mediaUrl = URL.createObjectURL(upload.mediaBlob);
  } catch {
    mediaUrl = upload.posterDataUrl;
  }

  return {
    id: upload.id,
    slug: upload.slug,
    title: upload.title,
    description: upload.description,
    category: upload.category || "cats",
    mood: upload.mood || "calm",
    tags: upload.tags || [],
    creator: upload.creator || "You",
    license: upload.license || "Personal Upload",
    duration_seconds: upload.duration_seconds || 3.0,
    width: upload.width || 480,
    height: upload.height || 480,
    aspect_ratio: upload.aspect_ratio || 1.0,
    poster: upload.posterDataUrl || mediaUrl,
    mp4: mediaUrl,
    gif: mediaUrl,
    poster_bytes: Math.round(upload.bytes * 0.05),
    mp4_bytes: upload.bytes,
    gif_bytes: upload.bytes,
    published_at: upload.uploadedAt,
  };
}
