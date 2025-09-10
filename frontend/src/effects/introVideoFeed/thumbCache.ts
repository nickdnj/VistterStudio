/**
 * Thumbnail caching system with IndexedDB persistence
 * Stores cached thumbnails for video sources to mask load latency
 */

interface ThumbnailData {
  sourceId: string;
  dataUrl: string;
  timestamp: number;
  version: string;
}

interface CacheEntry {
  sourceId: string;
  image: HTMLImageElement;
  timestamp: number;
}

class ThumbnailCache {
  private dbName = 'VistterStudio_ThumbnailCache';
  private dbVersion = 1;
  private storeName = 'thumbnails';
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, CacheEntry>();
  private maxMemoryEntries = 50;
  private ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'sourceId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getThumb(sourceId: string): Promise<HTMLImageElement | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(sourceId);
    if (memEntry && !this.isExpired(memEntry.timestamp)) {
      this.touch(sourceId);
      return memEntry.image;
    }

    // Check IndexedDB
    if (this.db) {
      try {
        const data = await this.getFromDB(sourceId);
        if (data && !this.isExpired(data.timestamp)) {
          const image = await this.dataUrlToImage(data.dataUrl);
          this.addToMemoryCache(sourceId, image, data.timestamp);
          return image;
        }
      } catch (error) {
        console.warn('Failed to load thumbnail from IndexedDB:', error);
      }
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`thumb_${sourceId}`);
      if (stored) {
        const data: ThumbnailData = JSON.parse(stored);
        if (!this.isExpired(data.timestamp)) {
          const image = await this.dataUrlToImage(data.dataUrl);
          this.addToMemoryCache(sourceId, image, data.timestamp);
          return image;
        } else {
          localStorage.removeItem(`thumb_${sourceId}`);
        }
      }
    } catch (error) {
      console.warn('Failed to load thumbnail from localStorage:', error);
    }

    return null;
  }

  async setThumb(sourceId: string, source: HTMLImageElement | HTMLCanvasElement | string): Promise<void> {
    const timestamp = Date.now();
    const version = '1.0';
    let dataUrl: string;

    if (typeof source === 'string') {
      dataUrl = source;
    } else if (source instanceof HTMLImageElement) {
      dataUrl = await this.imageToDataUrl(source);
    } else if (source instanceof HTMLCanvasElement) {
      dataUrl = source.toDataURL('image/jpeg', 0.8);
    } else {
      throw new Error('Invalid source type for thumbnail');
    }

    const data: ThumbnailData = {
      sourceId,
      dataUrl,
      timestamp,
      version
    };

    // Store in memory cache
    try {
      const image = await this.dataUrlToImage(dataUrl);
      this.addToMemoryCache(sourceId, image, timestamp);
    } catch (error) {
      console.warn('Failed to create image for memory cache:', error);
    }

    // Store in IndexedDB
    if (this.db) {
      try {
        await this.saveToDB(data);
      } catch (error) {
        console.warn('Failed to save thumbnail to IndexedDB:', error);
        // Fallback to localStorage
        this.saveToLocalStorage(data);
      }
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage(data);
    }
  }

  touch(sourceId: string): void {
    const entry = this.memoryCache.get(sourceId);
    if (entry) {
      // Move to end of cache (LRU)
      this.memoryCache.delete(sourceId);
      this.memoryCache.set(sourceId, entry);
    }
  }

  async captureFromVideo(sourceId: string, videoElement: HTMLVideoElement): Promise<void> {
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(320, videoElement.videoWidth);
    canvas.height = Math.min(240, videoElement.videoHeight);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    await this.setThumb(sourceId, canvas);
  }

  async clearExpired(): Promise<void> {
    const now = Date.now();
    
    // Clear memory cache
    for (const [sourceId, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry.timestamp)) {
        this.memoryCache.delete(sourceId);
      }
    }

    // Clear IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(now - this.ttlMs);
        
        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } catch (error) {
        console.warn('Failed to clear expired thumbnails from IndexedDB:', error);
      }
    }

    // Clear localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('thumb_')) {
          try {
            const data: ThumbnailData = JSON.parse(localStorage.getItem(key)!);
            if (this.isExpired(data.timestamp)) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear expired thumbnails from localStorage:', error);
    }
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.ttlMs;
  }

  private addToMemoryCache(sourceId: string, image: HTMLImageElement, timestamp: number): void {
    // Implement LRU eviction
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(sourceId, { sourceId, image, timestamp });
  }

  private async getFromDB(sourceId: string): Promise<ThumbnailData | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(sourceId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async saveToDB(data: ThumbnailData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private saveToLocalStorage(data: ThumbnailData): void {
    try {
      // Check if we have space (rough estimate)
      const serialized = JSON.stringify(data);
      if (serialized.length > 1024 * 1024) { // Skip if > 1MB
        console.warn('Thumbnail too large for localStorage');
        return;
      }
      localStorage.setItem(`thumb_${data.sourceId}`, serialized);
    } catch (error) {
      console.warn('Failed to save thumbnail to localStorage:', error);
    }
  }

  private async dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  private async imageToDataUrl(image: HTMLImageElement): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}

// Singleton instance
export const thumbCache = new ThumbnailCache();

// Initialize on module load
thumbCache.init().catch(console.error);

// Cleanup expired entries periodically
setInterval(() => {
  thumbCache.clearExpired().catch(console.error);
}, 60 * 60 * 1000); // Every hour
