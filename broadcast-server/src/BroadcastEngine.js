const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * BroadcastEngine - Core engine managing broadcast sessions and timeline playback
 * This orchestrates the entire broadcast pipeline from timeline to stream output
 */
class BroadcastEngine extends EventEmitter {
  constructor() {
    super();
    
    // Broadcast state
    this.isLive = false;
    this.isRecording = false;
    this.isPlaying = false;
    this.isLooping = false;
    
    // Timeline state
    this.currentTimeMs = 0;
    this.timelineDuration = 0;
    this.playbackRate = 1;
    this.timeline = null;
    
    // Session info
    this.sessionId = null;
    this.startTime = null;
    this.viewers = 0;
    this.bitrate = 0;
    
    // Components
    this.timelineRenderer = null;
    this.streamManager = null;
    this.mediaProcessor = null;
    
    // Playback loop
    this.playbackInterval = null;
    this.lastUpdateTime = 0;
    
    console.log('🎬 BroadcastEngine initialized');
  }
  
  // Set component references
  setTimelineRenderer(renderer) {
    this.timelineRenderer = renderer;
    console.log('📺 Timeline renderer connected');
  }
  
  setStreamManager(manager) {
    this.streamManager = manager;
    console.log('📡 Stream manager connected');
  }
  
  setMediaProcessor(processor) {
    this.mediaProcessor = processor;
    console.log('🎛️ Media processor connected');
  }
  
  // Update timeline composition
  updateTimeline(timelineData) {
    this.timeline = timelineData;
    
    // Calculate timeline duration
    this.timelineDuration = this.calculateTimelineDuration(timelineData);
    
    // Update timeline renderer
    if (this.timelineRenderer) {
      this.timelineRenderer.updateTimeline(timelineData);
    }
    
    console.log(`📝 Timeline updated - Duration: ${this.timelineDuration}ms`);
    this.emit('timeline:updated', timelineData);
  }
  
  // Calculate total timeline duration
  calculateTimelineDuration(timeline) {
    if (!timeline || !timeline.clips) return 60000; // Default 60 seconds
    
    let maxDuration = 60000; // Minimum 60 seconds
    
    timeline.clips.forEach(clip => {
      const clipEnd = clip.startTimeMs + clip.durationMs;
      if (clipEnd > maxDuration) {
        maxDuration = clipEnd;
      }
    });
    
    return maxDuration;
  }
  
  // Playback controls
  play() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.lastUpdateTime = Date.now();
    this.startPlaybackLoop();
    
    console.log('▶️ Playback started');
    this.emit('playback:started');
  }
  
  pause() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.stopPlaybackLoop();
    
    console.log('⏸️ Playback paused');
    this.emit('playback:paused');
  }
  
  stop() {
    this.pause();
    this.currentTimeMs = 0;
    
    console.log('⏹️ Playback stopped');
    this.emit('playback:stopped');
  }
  
  seekTo(timeMs) {
    const wasPlaying = this.isPlaying;
    this.pause();
    
    this.currentTimeMs = Math.max(0, Math.min(timeMs, this.timelineDuration));
    
    if (wasPlaying) {
      this.play();
    }
    
    console.log(`⏭️ Seeked to: ${this.currentTimeMs}ms`);
    this.emit('playback:seeked', this.currentTimeMs);
  }
  
  toggleLoop() {
    this.isLooping = !this.isLooping;
    console.log(`🔄 Loop ${this.isLooping ? 'enabled' : 'disabled'}`);
    this.emit('loop:toggled', this.isLooping);
  }
  
  // Playback loop management
  startPlaybackLoop() {
    this.playbackInterval = setInterval(() => {
      const now = Date.now();
      const deltaMs = (now - this.lastUpdateTime) * this.playbackRate;
      this.lastUpdateTime = now;
      
      this.currentTimeMs += deltaMs;
      
      // Handle end of timeline
      if (this.currentTimeMs >= this.timelineDuration) {
        if (this.isLooping) {
          // Loop back to beginning
          this.currentTimeMs = 0;
          console.log('🔄 Timeline looped');
        } else {
          // Stop at end
          this.currentTimeMs = this.timelineDuration;
          this.pause();
          console.log('⏹️ Timeline ended');
        }
      }
      
      // Update renderer with current timeline position
      if (this.timelineRenderer) {
        this.timelineRenderer.renderFrame(this.currentTimeMs);
      }
      
      this.emit('playback:time', this.currentTimeMs);
      
    }, 1000 / 30); // 30 FPS update rate
  }
  
  stopPlaybackLoop() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }
  
  // Broadcast controls
  async startBroadcast(config) {
    if (this.isLive) {
      throw new Error('Broadcast already active');
    }
    
    try {
      console.log('🔴 Starting broadcast...', config);
      
      // Validate configuration
      this.validateBroadcastConfig(config);
      
      // Initialize session
      this.sessionId = uuidv4();
      this.startTime = new Date();
      
      // Start stream manager
      if (this.streamManager) {
        await this.streamManager.startStream(config);
      }
      
      // Start media processor
      if (this.mediaProcessor) {
        await this.mediaProcessor.startProcessing(config);
      }
      
      // Connect renderer to stream
      if (this.timelineRenderer && this.streamManager) {
        this.timelineRenderer.connectToStream(this.streamManager);
      }
      
      this.isLive = true;
      
      // Auto-start playback if timeline is ready
      if (this.timeline && !this.isPlaying) {
        this.play();
      }
      
      console.log('✅ Broadcast started successfully');
      this.emit('broadcast:started', this.getStatus());
      
    } catch (error) {
      console.error('❌ Failed to start broadcast:', error);
      this.emit('broadcast:error', error);
      throw error;
    }
  }
  
  async stopBroadcast() {
    if (!this.isLive) {
      console.log('⚠️ No active broadcast to stop');
      return;
    }
    
    try {
      console.log('⏹️ Stopping broadcast...');
      
      // Stop stream manager
      if (this.streamManager) {
        await this.streamManager.stopStream();
      }
      
      // Stop media processor
      if (this.mediaProcessor) {
        await this.mediaProcessor.stopProcessing();
      }
      
      // Disconnect renderer
      if (this.timelineRenderer) {
        this.timelineRenderer.disconnectFromStream();
      }
      
      this.isLive = false;
      this.sessionId = null;
      this.startTime = null;
      this.viewers = 0;
      this.bitrate = 0;
      
      console.log('✅ Broadcast stopped successfully');
      this.emit('broadcast:stopped', this.getStatus());
      
    } catch (error) {
      console.error('❌ Failed to stop broadcast:', error);
      this.emit('broadcast:error', error);
      throw error;
    }
  }
  
  async startRecording() {
    if (this.isRecording) {
      throw new Error('Recording already active');
    }
    
    try {
      console.log('🎥 Starting recording...');
      
      if (this.mediaProcessor) {
        await this.mediaProcessor.startRecording();
      }
      
      this.isRecording = true;
      
      console.log('✅ Recording started successfully');
      this.emit('recording:started', this.getStatus());
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.emit('recording:error', error);
      throw error;
    }
  }
  
  async stopRecording() {
    if (!this.isRecording) {
      console.log('⚠️ No active recording to stop');
      return;
    }
    
    try {
      console.log('⏹️ Stopping recording...');
      
      if (this.mediaProcessor) {
        await this.mediaProcessor.stopRecording();
      }
      
      this.isRecording = false;
      
      console.log('✅ Recording stopped successfully');
      this.emit('recording:stopped', this.getStatus());
      
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      this.emit('recording:error', error);
      throw error;
    }
  }
  
  // Configuration validation
  validateBroadcastConfig(config) {
    if (!config) {
      throw new Error('Broadcast configuration is required');
    }
    
    if (!config.platform) {
      throw new Error('Streaming platform is required');
    }
    
    if (!config.streamKey && config.platform !== 'custom') {
      throw new Error('Stream key is required');
    }
    
    if (!config.resolution) {
      config.resolution = '1920x1080'; // Default resolution
    }
    
    if (!config.bitrate) {
      config.bitrate = 3500; // Default bitrate
    }
    
    console.log('✅ Broadcast configuration validated');
  }
  
  // Get current broadcast status
  getStatus() {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    
    return {
      // Broadcast state
      isLive: this.isLive,
      isRecording: this.isRecording,
      sessionId: this.sessionId,
      
      // Playback state
      isPlaying: this.isPlaying,
      isLooping: this.isLooping,
      currentTimeMs: this.currentTimeMs,
      timelineDuration: this.timelineDuration,
      playbackRate: this.playbackRate,
      
      // Stream metrics
      uptime: uptime,
      viewers: this.viewers,
      bitrate: this.bitrate,
      
      // Timeline info
      hasTimeline: !!this.timeline,
      timelineClips: this.timeline?.clips?.length || 0,
      
      // Timestamps
      startTime: this.startTime,
      currentTime: new Date()
    };
  }
  
  // Update stream metrics (called by stream manager)
  updateMetrics(metrics) {
    this.viewers = metrics.viewers || 0;
    this.bitrate = metrics.bitrate || 0;
    
    this.emit('metrics:updated', metrics);
  }
  
  // Cleanup
  destroy() {
    console.log('🧹 Destroying broadcast engine...');
    
    this.stopPlaybackLoop();
    
    if (this.isLive) {
      this.stopBroadcast();
    }
    
    if (this.isRecording) {
      this.stopRecording();
    }
    
    this.removeAllListeners();
    console.log('✅ Broadcast engine destroyed');
  }
}

module.exports = BroadcastEngine;
