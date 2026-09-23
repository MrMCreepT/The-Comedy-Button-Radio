/**
 * IndexedDB storage utility for Offline PWA episode downloads and audio caching.
 * Provides resilient, asynchronous audio file caching with download progress monitoring.
 */

const DB_NAME = 'comedy_button_offline_db';
const DB_VERSION = 2;
const STORE_NAME = 'episodes_audio';
const RESUME_STORE_NAME = 'playback_resume';

export interface PlaybackResumePoint {
  episodeId: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export interface StoredEpisodeAudio {
  id: string; // episode id
  guid: string;
  title: string;
  blob: Blob;
  sizeBytes: number;
  downloadedAt: number;
  mimeType: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device.'));
      return;
    }

    // Safety timeout: If IndexedDB hangs or is partitioned in iframe, reject after 400ms
    const timeout = setTimeout(() => {
      reject(new Error('IndexedDB connection timed out.'));
    }, 400);

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(RESUME_STORE_NAME)) {
          db.createObjectStore(RESUME_STORE_NAME, { keyPath: 'episodeId' });
        }
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        resolve(request.result);
      };

      request.onerror = () => {
        clearTimeout(timeout);
        reject(request.error || new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        clearTimeout(timeout);
        reject(new Error('IndexedDB open blocked'));
      };
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  }).catch((err) => {
    // Reset dbPromise on failure so future attempts don't immediately fail with same rejection
    dbPromise = null;
    throw err;
  });

  return dbPromise;
}

/**
 * Synchronously retrieve saved resume point from localStorage (instant 0ms, zero lag, no promise delay)
 */
export function getEpisodeResumePointSync(episodeId: string): number | null {
  if (!episodeId) return null;
  try {
    const raw = localStorage.getItem(`cb_resume_${episodeId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.currentTime === 'number' && parsed.currentTime > 5 && (parsed.duration === 0 || parsed.currentTime < parsed.duration - 15)) {
        return parsed.currentTime;
      }
    }
  } catch {}
  return null;
}

/**
 * Check if an episode is cached offline
 */
export async function isEpisodeSavedOffline(episodeId: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(episodeId);

      request.onsuccess = () => {
        resolve(Boolean(request.result));
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

/**
 * Get offline object URL for cached episode
 */
export async function getOfflineEpisodeBlob(episodeId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(episodeId);

      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Download and cache an episode audio in IndexedDB with real-time percentage progress
 */
export async function downloadEpisodeForOffline(
  episode: { id: string; guid: string; title: string; audioUrl: string },
  onProgress?: (percent: number) => void
): Promise<void> {
  // Use proxy endpoint if direct CORS is blocked, or fallback directly
  const targetUrl = episode.audioUrl;
  const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(targetUrl)}`;

  let response: Response;
  try {
    // Try proxy first (avoids cross-origin blocking on Libsyn)
    response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Proxy status: ${response.status}`);
    }
  } catch {
    // Fall back to direct audioUrl
    response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio stream: ${response.status}`);
    }
  }

  const contentLengthHeader = response.headers.get('content-length');
  const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

  let blob: Blob;

  if (response.body && totalBytes > 0 && onProgress) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        const progress = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
        onProgress(progress);
      }
    }

    blob = new Blob(chunks, { type: 'audio/mpeg' });
  } else {
    // Basic blob fallback
    if (onProgress) onProgress(50);
    blob = await response.blob();
    if (onProgress) onProgress(100);
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record: StoredEpisodeAudio = {
      id: episode.id,
      guid: episode.guid,
      title: episode.title,
      blob,
      sizeBytes: blob.size,
      downloadedAt: Date.now(),
      mimeType: blob.type || 'audio/mpeg'
    };

    const putRequest = store.put(record);

    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error || new Error('Failed to store audio'));
  });
}

/**
 * Delete an episode from offline storage
 */
export async function deleteOfflineEpisode(episodeId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const deleteRequest = store.delete(episodeId);

    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
}

/**
 * List all downloaded offline episode IDs and metadata
 */
export async function getAllOfflineEpisodeIds(): Promise<string[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve((request.result || []).map(String));
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Save playback timestamp resume point locally (IndexedDB scrubbing cache)
 */
export async function saveEpisodeResumePoint(episodeId: string, currentTime: number, duration: number): Promise<void> {
  if (!episodeId || currentTime < 2) return;
  try {
    const db = await getDB();
    const transaction = db.transaction(RESUME_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(RESUME_STORE_NAME);
    const point: PlaybackResumePoint = {
      episodeId,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      updatedAt: Date.now()
    };
    store.put(point);
  } catch {
    // Also save in localStorage as quick fallback
    try {
      localStorage.setItem(`cb_resume_${episodeId}`, JSON.stringify({
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        updatedAt: Date.now()
      }));
    } catch {}
  }
}

/**
 * Retrieve saved resume point for an episode
 */
export async function getEpisodeResumePoint(episodeId: string): Promise<number | null> {
  if (!episodeId) return null;
  try {
    const db = await getDB();
    const result = await new Promise<PlaybackResumePoint | null>((resolve) => {
      const transaction = db.transaction(RESUME_STORE_NAME, 'readonly');
      const store = transaction.objectStore(RESUME_STORE_NAME);
      const request = store.get(episodeId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });

    if (result && result.currentTime > 5 && (result.duration === 0 || result.currentTime < result.duration - 15)) {
      return result.currentTime;
    }
  } catch {}

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`cb_resume_${episodeId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.currentTime > 5 && (parsed.duration === 0 || parsed.currentTime < parsed.duration - 15)) {
        return parsed.currentTime;
      }
    }
  } catch {}

  return null;
}

/**
 * Clear resume point for an episode when finished
 */
export async function clearEpisodeResumePoint(episodeId: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(RESUME_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(RESUME_STORE_NAME);
    store.delete(episodeId);
  } catch {}
  try {
    localStorage.removeItem(`cb_resume_${episodeId}`);
  } catch {}
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
