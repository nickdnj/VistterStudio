const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

/**
 * TimelineRenderer - Server-side timeline composition and rendering
 * Renders timeline content to canvas frames for broadcast streaming
 */
class TimelineRenderer {
  constructor(options = {}) {
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.framerate = options.framerate || 30;
    
    // Create canvas and context
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    
    // Timeline data
    this.timeline = null;
    this.currentFrame = null;
    
    // Asset cache
    this.imageCache = new Map();
    this.videoCache = new Map();
    
    // Stream connection
    this.streamManager = null;
    this.isConnected = false;
    
    // Rendering state
    this.isRendering = false;
    this.frameCount = 0;
    this.renderStartTime = null;
    this.renderingInterval = null;
    
    console.log(`🎨 TimelineRenderer initialized: ${this.width}x${this.height}@${this.framerate}fps`);
  }
  
  // Update timeline composition
  updateTimeline(timeline) {
    this.timeline = timeline;
    console.log(`📝 Timeline updated with ${timeline.clips?.length || 0} clips`);
    
    // Pre-load assets
    this.preloadAssets(timeline);
  }
  
  // Pre-load timeline assets into cache
  async preloadAssets(timeline) {
    if (!timeline || !timeline.clips) return;
    
    console.log('📦 Pre-loading timeline assets...');
    
    const loadPromises = timeline.clips.map(async (clip) => {
      try {
        if (clip.type === 'image' && clip.assetPath) {
          await this.loadImageAsset(clip.assetPath);
        } else if (clip.type === 'video' && clip.assetPath) {
          await this.loadVideoAsset(clip.assetPath);
        }
      } catch (error) {
        console.error(`❌ Failed to load asset: ${clip.assetPath}`, error.message);
      }
    });
    
    await Promise.allSettled(loadPromises);
    console.log('✅ Asset pre-loading completed');
  }
  
  // Load image asset into cache
  async loadImageAsset(assetPath) {
    if (this.imageCache.has(assetPath)) return;
    
    try {
      let imagePath;
      
      if (assetPath.startsWith('http')) {
        // Download remote image
        const response = await axios.get(assetPath, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const image = await loadImage(buffer);
        this.imageCache.set(assetPath, image);
        console.log(`📷 Loaded remote image: ${assetPath}`);
      } else {
        // Load local image
        imagePath = path.resolve(assetPath);
        if (await fs.pathExists(imagePath)) {
          const image = await loadImage(imagePath);
          this.imageCache.set(assetPath, image);
          console.log(`📷 Loaded local image: ${assetPath}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to load image: ${assetPath}`, error.message);
    }
  }
  
  // Load video asset metadata (for future video support)
  async loadVideoAsset(assetPath) {
    if (this.videoCache.has(assetPath)) return;
    
    try {
      // For now, store video metadata
      // In the future, this would integrate with FFmpeg for video frame extraction
      const videoInfo = {
        path: assetPath,
        duration: 0, // Would be extracted from video
        width: this.width,
        height: this.height,
        framerate: this.framerate
      };
      
      this.videoCache.set(assetPath, videoInfo);
      console.log(`🎬 Loaded video metadata: ${assetPath}`);
    } catch (error) {
      console.error(`❌ Failed to load video: ${assetPath}`, error.message);
    }
  }
  
  // Render frame at specific timeline position
  async renderFrame(timeMs) {
    try {
      // Clear canvas with black background
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      if (!this.timeline || !this.timeline.clips || this.timeline.clips.length === 0) {
        // Render VistterStudio branding when no timeline
        this.renderBrandingFrame();
      } else {
        // Get active clips at current time
        const activeClips = this.getActiveClips(timeMs);
        
        if (activeClips.length === 0) {
          // No active clips, show timeline waiting state
          this.renderWaitingFrame(timeMs);
        } else {
          // Render active clips in layer order
          for (const clip of activeClips) {
            await this.renderClip(clip, timeMs);
          }
        }
      }
      
      // Add timeline info overlay
      this.renderTimelineOverlay(timeMs);
      
      this.frameCount++;
      
      // Send frame to stream if connected
      if (this.isConnected && this.streamManager) {
        const frameBuffer = this.canvas.toBuffer('raw');
        this.streamManager.sendFrame(frameBuffer);
      }
      
    } catch (error) {
      console.error('❌ Frame rendering error:', error);
      this.renderErrorFrame(error.message);
    }
  }
  
  // Get clips active at specific time
  getActiveClips(timeMs) {
    if (!this.timeline || !this.timeline.clips) return [];
    
    return this.timeline.clips
      .filter(clip => {
        const clipStart = clip.startTimeMs || 0;
        const clipEnd = clipStart + (clip.durationMs || 5000);
        return timeMs >= clipStart && timeMs < clipEnd;
      })
      .sort((a, b) => {
        // Sort by track order and then by z-index
        const trackOrderA = this.getTrackOrder(a.trackId);
        const trackOrderB = this.getTrackOrder(b.trackId);
        
        if (trackOrderA !== trackOrderB) {
          return trackOrderA - trackOrderB;
        }
        
        return (a.zIndex || 0) - (b.zIndex || 0);
      });
  }
  
  // Get track rendering order
  getTrackOrder(trackId) {
    // Main video track renders first (background)
    if (trackId === 'main' || trackId?.includes('video')) return 0;
    
    // Overlay tracks render on top
    if (trackId?.includes('overlay')) return 1;
    
    // Audio tracks don't render visually
    if (trackId?.includes('audio')) return -1;
    
    return 0;
  }
  
  // Render individual clip
  async renderClip(clip, timeMs) {
    const clipStart = clip.startTimeMs || 0;
    const clipProgress = (timeMs - clipStart) / (clip.durationMs || 5000);
    
    // Apply clip transformations
    this.ctx.save();
    this.applyClipTransform(clip);
    
    try {
      switch (clip.type) {
        case 'camera':
          await this.renderCameraClip(clip, clipProgress);
          break;
        case 'image':
          await this.renderImageClip(clip, clipProgress);
          break;
        case 'video':
          await this.renderVideoClip(clip, clipProgress);
          break;
        case 'text':
          await this.renderTextClip(clip, clipProgress);
          break;
        default:
          console.warn(`Unknown clip type: ${clip.type}`);
      }
    } catch (error) {
      console.error(`❌ Error rendering ${clip.type} clip:`, error.message);
      this.renderClipError(clip);
    }
    
    this.ctx.restore();
  }
  
  // Apply clip transformations (position, scale, opacity)
  applyClipTransform(clip) {
    const x = clip.x || 0;
    const y = clip.y || 0;
    const scale = (clip.scale || 100) / 100;
    const opacity = (clip.opacity || 100) / 100;
    const rotation = (clip.rotation || 0) * Math.PI / 180;
    
    // Apply transformations
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.rotate(rotation);
    this.ctx.globalAlpha = opacity;
  }
  
  // Render camera clip
  async renderCameraClip(clip, progress) {
    const width = clip.width || this.width;
    const height = clip.height || this.height;
    
    // Professional camera display
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a202c');
    gradient.addColorStop(0.5, '#2d3748');
    gradient.addColorStop(1, '#1a202c');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    
    // Grid pattern background
    this.ctx.strokeStyle = 'rgba(74, 85, 104, 0.3)';
    this.ctx.lineWidth = 1;
    const gridSize = 50;
    
    for (let x = 0; x <= width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
    
    // Camera information display
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 64px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('📹', width / 2, height / 2 - 60);
    
    // Camera name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillText(clip.camera?.name || 'RTMP Camera', width / 2, height / 2 + 20);
    
    // Camera details
    if (clip.camera) {
      this.ctx.fillStyle = '#a0aec0';
      this.ctx.font = '20px Arial';
      this.ctx.fillText(`${clip.camera.host}:${clip.camera.port}`, width / 2, height / 2 + 60);
      this.ctx.fillText(`Channel ${clip.camera.channel} • Stream ${clip.camera.stream}`, width / 2, height / 2 + 90);
    }
    
    // Live indicator with animation
    const time = Date.now() / 1000;
    const pulseAlpha = (Math.sin(time * 3) + 1) / 2 * 0.5 + 0.5;
    
    this.ctx.fillStyle = `rgba(229, 62, 62, ${pulseAlpha})`;
    this.ctx.beginPath();
    this.ctx.arc(60, 60, 20, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LIVE', 60, 65);
    
    // Stream status
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(width - 200, 20, 180, 60);
    
    this.ctx.fillStyle = '#4ade80';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('🔴 RTMP ACTIVE', width - 20, 40);
    this.ctx.fillText('📡 STREAMING', width - 20, 60);
  }
  
  // Render image clip
  async renderImageClip(clip, progress) {
    const image = this.imageCache.get(clip.assetPath);
    if (!image) {
      this.renderClipError(clip, 'Image not loaded');
      return;
    }
    
    const width = clip.width || image.width;
    const height = clip.height || image.height;
    
    this.ctx.drawImage(image, 0, 0, width, height);
  }
  
  // Render video clip
  async renderVideoClip(clip, progress) {
    // Placeholder for video rendering
    // In the future, this would extract frames from video files
    const width = clip.width || 640;
    const height = clip.height || 480;
    
    this.ctx.fillStyle = '#2d3748';
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🎬 VIDEO', width / 2, height / 2);
    
    // Progress bar
    const progressWidth = width * 0.8;
    const progressX = (width - progressWidth) / 2;
    const progressY = height / 2 + 30;
    
    this.ctx.strokeStyle = '#4a5568';
    this.ctx.strokeRect(progressX, progressY, progressWidth, 4);
    
    this.ctx.fillStyle = '#38b2ac';
    this.ctx.fillRect(progressX, progressY, progressWidth * progress, 4);
  }
  
  // Render text clip
  async renderTextClip(clip, progress) {
    const text = clip.text || 'Sample Text';
    const fontSize = clip.fontSize || 48;
    const fontFamily = clip.fontFamily || 'Arial';
    const color = clip.color || '#ffffff';
    
    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = clip.textAlign || 'center';
    
    // Add text shadow for better visibility
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fillText(text, 0, 0);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }
  
  // Render clip error placeholder
  renderClipError(clip, message = 'Render Error') {
    const width = clip.width || 200;
    const height = clip.height || 100;
    
    this.ctx.fillStyle = '#e53e3e';
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('❌', width / 2, height / 2 - 10);
    this.ctx.font = '12px Arial';
    this.ctx.fillText(message, width / 2, height / 2 + 10);
  }
  
  // Render VistterStudio branding frame
  renderBrandingFrame() {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#1a202c');
    gradient.addColorStop(1, '#2d3748');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // VistterStudio logo/text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('VistterStudio', this.width / 2, this.height / 2 - 40);
    
    this.ctx.fillStyle = '#a0aec0';
    this.ctx.font = '32px Arial';
    this.ctx.fillText('Professional Timeline Broadcasting', this.width / 2, this.height / 2 + 20);
    
    this.ctx.fillStyle = '#4299e1';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Add content to timeline to start broadcasting', this.width / 2, this.height / 2 + 80);
    
    // Add animated elements
    const time = Date.now() / 1000;
    const pulseAlpha = (Math.sin(time * 2) + 1) / 2 * 0.3 + 0.1;
    
    this.ctx.fillStyle = `rgba(66, 153, 225, ${pulseAlpha})`;
    this.ctx.beginPath();
    this.ctx.arc(this.width / 2, this.height / 2 - 100, 30, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  // Render waiting frame (timeline has no active clips)
  renderWaitingFrame(timeMs) {
    // Dark background
    this.ctx.fillStyle = '#1a202c';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Timeline position indicator
    this.ctx.fillStyle = '#4299e1';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⏸️', this.width / 2, this.height / 2 - 40);
    
    this.ctx.fillStyle = '#a0aec0';
    this.ctx.font = '28px Arial';
    this.ctx.fillText('Timeline Playing', this.width / 2, this.height / 2 + 20);
    
    this.ctx.fillStyle = '#718096';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`No content at ${Math.round(timeMs)}ms`, this.width / 2, this.height / 2 + 60);
  }
  
  // Render timeline overlay with current info
  renderTimelineOverlay(timeMs) {
    // Timeline info in bottom-left corner
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(20, this.height - 100, 300, 80);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    this.ctx.fillText(`🎬 VistterStudio Live`, 30, this.height - 70);
    this.ctx.fillText(`⏱️ Timeline: ${timeStr}`, 30, this.height - 50);
    this.ctx.fillText(`🎞️ Frame: ${this.frameCount}`, 30, this.height - 30);
    
    // Live indicator in top-right
    this.ctx.fillStyle = '#e53e3e';
    this.ctx.beginPath();
    this.ctx.arc(this.width - 50, 50, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LIVE', this.width - 50, 55);
  }
  
  // Render error frame
  renderErrorFrame(message) {
    this.ctx.fillStyle = '#e53e3e';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('❌', this.width / 2, this.height / 2 - 40);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Render Error', this.width / 2, this.height / 2);
    
    this.ctx.font = '16px Arial';
    this.ctx.fillText(message, this.width / 2, this.height / 2 + 30);
  }
  
  // Render debug overlay
  renderDebugOverlay(timeMs) {
    const debugText = [
      `Time: ${Math.round(timeMs)}ms`,
      `Frame: ${this.frameCount}`,
      `Resolution: ${this.width}x${this.height}`,
      `FPS: ${this.framerate}`
    ];
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 250, debugText.length * 20 + 10);
    
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    
    debugText.forEach((text, index) => {
      this.ctx.fillText(text, 20, 30 + index * 20);
    });
  }
  
  // Connect to stream manager
  connectToStream(streamManager) {
    this.streamManager = streamManager;
    this.isConnected = true;
    this.renderStartTime = Date.now();
    
    // Start continuous rendering loop for streaming
    this.startRenderingLoop();
    
    console.log('🔗 Timeline renderer connected to stream');
  }
  
  // Start continuous rendering loop
  startRenderingLoop() {
    if (this.renderingInterval) {
      clearInterval(this.renderingInterval);
    }
    
    console.log('🎬 Starting timeline rendering loop at 30 FPS');
    
    let currentTimeMs = 0;
    const frameInterval = 1000 / 30; // 30 FPS
    
    this.renderingInterval = setInterval(async () => {
      if (!this.isConnected) {
        return;
      }
      
      // Render current frame
      await this.renderFrame(currentTimeMs);
      
      // Advance time
      currentTimeMs += frameInterval;
      
      // Loop back to start if we have a timeline
      if (this.timeline && currentTimeMs >= (this.timeline.duration || 30000)) {
        currentTimeMs = 0;
      } else if (!this.timeline && currentTimeMs >= 10000) {
        // For branding screen, loop every 10 seconds
        currentTimeMs = 0;
      }
      
    }, frameInterval);
  }
  
  // Stop rendering loop
  stopRenderingLoop() {
    if (this.renderingInterval) {
      clearInterval(this.renderingInterval);
      this.renderingInterval = null;
      console.log('⏹️ Timeline rendering loop stopped');
    }
  }
  
  // Disconnect from stream
  disconnectFromStream() {
    this.isConnected = false;
    this.streamManager = null;
    this.stopRenderingLoop();
    console.log('🔌 Timeline renderer disconnected from stream');
  }
  
  // Get rendering statistics
  getStats() {
    const uptime = this.renderStartTime ? Date.now() - this.renderStartTime : 0;
    const fps = this.frameCount > 0 && uptime > 0 ? (this.frameCount / (uptime / 1000)) : 0;
    
    return {
      frameCount: this.frameCount,
      uptime: uptime,
      averageFPS: Math.round(fps * 10) / 10,
      isConnected: this.isConnected,
      hasTimeline: !!this.timeline,
      cacheSize: {
        images: this.imageCache.size,
        videos: this.videoCache.size
      }
    };
  }
  
  // Cleanup
  destroy() {
    console.log('🧹 Destroying timeline renderer...');
    
    this.disconnectFromStream();
    this.imageCache.clear();
    this.videoCache.clear();
    
    console.log('✅ Timeline renderer destroyed');
  }
}

module.exports = TimelineRenderer;
