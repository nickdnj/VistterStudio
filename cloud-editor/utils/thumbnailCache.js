/**
 * Thumbnail Cache System for Camera Feeds
 * Captures and caches thumbnails from camera streams for smooth loading transitions
 */

class ThumbnailCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // Limit cache size to prevent memory issues
  }

  /**
   * Capture a thumbnail from a video element or iframe
   * @param {string} cameraId - Unique camera identifier
   * @param {HTMLElement} element - Video element or iframe containing the stream
   * @returns {Promise<string|null>} Base64 data URL of the thumbnail
   */
  async captureFromElement(cameraId, element) {
    try {
      let canvas, ctx, video;
      
      if (element.tagName === 'VIDEO') {
        video = element;
      } else if (element.tagName === 'IFRAME') {
        // For iframe WebRTC streams, we can't directly capture
        // This is a limitation of cross-origin iframe content
        console.warn('Cannot capture thumbnail from iframe WebRTC stream');
        return null;
      } else {
        console.warn('Unsupported element type for thumbnail capture');
        return null;
      }

      // Only capture if video has loaded and has dimensions
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
      }

      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      
      // Set canvas size to match video aspect ratio but smaller for efficiency
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = 320;
      canvas.height = Math.round(320 / aspectRatio);
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Store in cache
      this.set(cameraId, dataUrl);
      
      console.log(`Captured thumbnail for camera ${cameraId}`);
      return dataUrl;
      
    } catch (error) {
      console.warn(`Failed to capture thumbnail for camera ${cameraId}:`, error);
      return null;
    }
  }

  /**
   * Capture thumbnail from stream URL (for HLS streams)
   * @param {string} cameraId - Unique camera identifier
   * @param {string} streamUrl - HLS stream URL
   * @returns {Promise<string|null>} Base64 data URL of the thumbnail
   */
  async captureFromStream(cameraId, streamUrl) {
    try {
      // Create a hidden video element to load the stream
      const video = document.createElement('video');
      video.style.display = 'none';
      video.crossOrigin = 'anonymous';
      video.muted = true;
      document.body.appendChild(video);

      return new Promise((resolve) => {
        let captured = false;
        
        const cleanup = () => {
          if (video.parentNode) {
            document.body.removeChild(video);
          }
        };

        const captureFrame = async () => {
          if (captured) return;
          captured = true;
          
          try {
            const thumbnail = await this.captureFromElement(cameraId, video);
            cleanup();
            resolve(thumbnail);
          } catch (error) {
            cleanup();
            resolve(null);
          }
        };

        // Capture when we have enough data
        video.addEventListener('loadeddata', captureFrame);
        video.addEventListener('canplay', captureFrame);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!captured) {
            cleanup();
            resolve(null);
          }
        }, 10000);

        video.src = streamUrl;
        video.load();
      });
      
    } catch (error) {
      console.warn(`Failed to capture thumbnail from stream for camera ${cameraId}:`, error);
      return null;
    }
  }

  /**
   * Get cached thumbnail for a camera
   * @param {string} cameraId - Unique camera identifier
   * @returns {string|null} Base64 data URL or null if not cached
   */
  get(cameraId) {
    return this.cache.get(cameraId) || null;
  }

  /**
   * Store thumbnail in cache
   * @param {string} cameraId - Unique camera identifier
   * @param {string} dataUrl - Base64 data URL of the thumbnail
   */
  set(cameraId, dataUrl) {
    // Remove oldest entries if cache is getting too large
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(cameraId, dataUrl);
  }

  /**
   * Check if thumbnail exists for a camera
   * @param {string} cameraId - Unique camera identifier
   * @returns {boolean}
   */
  has(cameraId) {
    return this.cache.has(cameraId);
  }

  /**
   * Remove thumbnail from cache
   * @param {string} cameraId - Unique camera identifier
   */
  remove(cameraId) {
    this.cache.delete(cameraId);
  }

  /**
   * Clear all thumbnails from cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache size and other stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      cameraIds: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const thumbnailCache = new ThumbnailCache();

export default thumbnailCache;
