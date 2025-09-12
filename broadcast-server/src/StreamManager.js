const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');
const EventEmitter = require('events');

/**
 * StreamManager - Manages RTMP streaming to various platforms
 * Handles encoding and streaming of rendered timeline frames
 */
class StreamManager extends EventEmitter {
  constructor() {
    super();
    
    // Stream state
    this.isStreaming = false;
    this.streamConfig = null;
    this.ffmpegProcess = null;
    
    // Stream metrics
    this.startTime = null;
    this.framesSent = 0;
    this.bytesTransferred = 0;
    this.droppedFrames = 0;
    this.currentBitrate = 0;
    
    // Frame input stream
    this.frameStream = null;
    
    // Health monitoring
    this.healthCheckInterval = null;
    this.lastFrameTime = 0;
    
    console.log('📡 StreamManager initialized');
  }
  
  // Start streaming with configuration
  async startStream(config) {
    if (this.isStreaming) {
      throw new Error('Stream already active');
    }
    
    try {
      console.log('🔴 Starting stream...', config);
      
      // Validate and store configuration
      this.streamConfig = this.validateConfig(config);
      
      // Create frame input stream
      this.createFrameStream();
      
      // Setup FFmpeg process
      await this.setupFFmpegProcess();
      
      this.isStreaming = true;
      this.startTime = Date.now();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log('✅ Stream started successfully');
      this.emit('stream:started', this.streamConfig);
      
    } catch (error) {
      console.error('❌ Failed to start stream:', error);
      this.cleanup();
      throw error;
    }
  }
  
  // Stop streaming
  async stopStream() {
    if (!this.isStreaming) {
      console.log('⚠️ No active stream to stop');
      return;
    }
    
    try {
      console.log('⏹️ Stopping stream...');
      
      this.isStreaming = false;
      
      // Stop health monitoring
      this.stopHealthMonitoring();
      
      // Close frame stream
      if (this.frameStream) {
        this.frameStream.end();
      }
      
      // Kill FFmpeg process
      if (this.ffmpegProcess) {
        this.ffmpegProcess.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (this.ffmpegProcess) {
            this.ffmpegProcess.kill('SIGKILL');
          }
        }, 5000);
      }
      
      this.cleanup();
      
      console.log('✅ Stream stopped successfully');
      this.emit('stream:stopped');
      
    } catch (error) {
      console.error('❌ Failed to stop stream:', error);
      this.cleanup();
      throw error;
    }
  }
  
  // Validate stream configuration
  validateConfig(config) {
    if (!config) {
      throw new Error('Stream configuration is required');
    }
    
    // Set defaults
    const validatedConfig = {
      platform: config.platform || 'custom',
      streamKey: config.streamKey,
      rtmpUrl: config.rtmpUrl,
      resolution: config.resolution || '1920x1080',
      framerate: config.framerate || 30,
      bitrate: config.bitrate || 3500,
      audioCodec: config.audioCodec || 'aac',
      videoCodec: config.videoCodec || 'libx264',
      preset: config.preset || 'veryfast',
      keyframeInterval: config.keyframeInterval || 2,
      bufferSize: config.bufferSize || config.bitrate * 2,
      maxrate: config.maxrate || config.bitrate * 1.2
    };
    
    // Platform-specific RTMP URLs
    switch (config.platform) {
      case 'youtube':
        validatedConfig.rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2/';
        break;
      case 'twitch':
        validatedConfig.rtmpUrl = 'rtmp://live.twitch.tv/live/';
        break;
      case 'facebook':
        validatedConfig.rtmpUrl = 'rtmps://live-api-s.facebook.com:443/rtmp/';
        break;
      case 'custom':
        if (!config.rtmpUrl) {
          throw new Error('Custom RTMP URL is required for custom platform');
        }
        break;
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
    
    if (!validatedConfig.streamKey) {
      throw new Error('Stream key is required');
    }
    
    console.log('✅ Stream configuration validated');
    return validatedConfig;
  }
  
  // Create readable stream for frame input
  createFrameStream() {
    this.frameStream = new Readable({
      read() {
        // Frames will be pushed from sendFrame()
      }
    });
    
    console.log('📺 Frame input stream created');
  }
  
  // Setup FFmpeg process for streaming
  async setupFFmpegProcess() {
    return new Promise((resolve, reject) => {
      const { resolution, framerate, bitrate, videoCodec, audioCodec, preset, keyframeInterval } = this.streamConfig;
      const [width, height] = resolution.split('x').map(Number);
      
      // Build RTMP URL with stream key
      const rtmpDestination = `${this.streamConfig.rtmpUrl}${this.streamConfig.streamKey}`;
      
      console.log(`📡 Setting up FFmpeg for ${resolution}@${framerate}fps, ${bitrate}k bitrate`);
      console.log(`🎯 Streaming to: ${this.streamConfig.platform} (${rtmpDestination.replace(this.streamConfig.streamKey, '***')})`);
      
      this.ffmpegProcess = ffmpeg()
        // For now, use a test pattern instead of raw frames
        // This will be replaced with actual timeline rendering later
        .input(`testsrc=duration=3600:size=${width}x${height}:rate=${framerate}`)
        .inputOptions(['-f', 'lavfi'])
        
        // Add silent audio
        .input('anullsrc=channel_layout=stereo:sample_rate=44100')
        .inputOptions(['-f', 'lavfi'])
        
        // Video encoding options
        .videoCodec(videoCodec)
        .videoBitrate(`${bitrate}k`)
        .size(resolution)
        .fps(framerate)
        .outputOptions([
          '-preset', preset,
          '-g', (framerate * keyframeInterval).toString(),
          '-keyint_min', framerate.toString(),
          '-sc_threshold', '0',
          '-bufsize', `${this.streamConfig.bufferSize}k`,
          '-maxrate', `${this.streamConfig.maxrate}k`,
          '-pix_fmt', 'yuv420p',
          '-profile:v', 'high',
          '-level', '4.1'
        ])
        
        // Audio options
        .audioCodec(audioCodec)
        .audioFrequency(44100)
        .audioChannels(2)
        .audioBitrate('128k')
        
        // RTMP output options
        .format('flv')
        .outputOptions([
          '-flvflags', 'no_duration_filesize',
          '-rtmp_live', 'live'
        ])
        
        // Destination
        .output(rtmpDestination);
      
      // Event handlers
      this.ffmpegProcess
        .on('start', (commandLine) => {
          console.log('🚀 FFmpeg started:', commandLine.replace(this.streamConfig.streamKey, '***'));
          resolve();
        })
        .on('progress', (progress) => {
          this.handleProgress(progress);
        })
        .on('error', (error) => {
          console.error('❌ FFmpeg error:', error.message);
          this.emit('stream:error', error);
          if (!this.isStreaming) {
            reject(error);
          }
        })
        .on('end', () => {
          console.log('🏁 FFmpeg process ended');
          this.emit('stream:ended');
        })
        .on('stderr', (stderrLine) => {
          // Parse stderr for additional metrics
          this.parseFFmpegOutput(stderrLine);
        });
      
      // Start the process
      this.ffmpegProcess.run();
    });
  }
  
  // Send frame data to stream
  sendFrame(frameBuffer) {
    if (!this.isStreaming || !this.frameStream) {
      return;
    }
    
    try {
      // Push frame to FFmpeg input stream
      const success = this.frameStream.push(frameBuffer);
      
      if (success) {
        this.framesSent++;
        this.lastFrameTime = Date.now();
        this.bytesTransferred += frameBuffer.length;
      } else {
        // Stream is backpressured
        this.droppedFrames++;
      }
      
    } catch (error) {
      console.error('❌ Error sending frame:', error.message);
      this.droppedFrames++;
    }
  }
  
  // Handle FFmpeg progress updates
  handleProgress(progress) {
    if (progress.currentFps) {
      // Update current bitrate estimate
      this.currentBitrate = Math.round(progress.currentKbps || 0);
    }
    
    // Emit progress event
    this.emit('stream:progress', {
      frames: progress.frames,
      currentFps: progress.currentFps,
      currentKbps: progress.currentKbps,
      targetSize: progress.targetSize,
      timemark: progress.timemark
    });
  }
  
  // Parse FFmpeg stderr output for additional metrics
  parseFFmpegOutput(line) {
    // Look for dropped frame indicators
    if (line.includes('drop') || line.includes('duplicate')) {
      this.droppedFrames++;
    }
    
    // Look for connection issues
    if (line.includes('Connection refused') || line.includes('timeout')) {
      this.emit('stream:connection_issue', line);
    }
    
    // Debug output in development
    if (process.env.NODE_ENV === 'development') {
      console.log('FFmpeg:', line);
    }
  }
  
  // Start health monitoring
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastFrame = now - this.lastFrameTime;
      
      // Check for stalled stream (no frames in 5 seconds)
      if (timeSinceLastFrame > 5000 && this.framesSent > 0) {
        console.warn('⚠️ Stream appears stalled - no frames sent recently');
        this.emit('stream:stalled');
      }
      
      // Emit health metrics
      this.emit('stream:health', this.getHealthMetrics());
      
    }, 2000); // Check every 2 seconds
  }
  
  // Stop health monitoring
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  // Get stream health metrics
  getHealthMetrics() {
    const uptime = this.startTime ? Date.now() - this.startTime : 0;
    const avgFps = this.framesSent > 0 && uptime > 0 ? (this.framesSent / (uptime / 1000)) : 0;
    
    return {
      isStreaming: this.isStreaming,
      uptime: uptime,
      framesSent: this.framesSent,
      droppedFrames: this.droppedFrames,
      bytesTransferred: this.bytesTransferred,
      currentBitrate: this.currentBitrate,
      averageFps: Math.round(avgFps * 10) / 10,
      dropRate: this.framesSent > 0 ? (this.droppedFrames / this.framesSent) * 100 : 0,
      connectionStatus: this.isStreaming ? 'connected' : 'disconnected',
      bufferHealth: this.calculateBufferHealth()
    };
  }
  
  // Calculate buffer health (0-100%)
  calculateBufferHealth() {
    if (!this.isStreaming) return 0;
    
    const timeSinceLastFrame = Date.now() - this.lastFrameTime;
    const maxAcceptableDelay = 1000; // 1 second
    
    const health = Math.max(0, 100 - (timeSinceLastFrame / maxAcceptableDelay) * 100);
    return Math.round(health);
  }
  
  // Update stream configuration
  updateConfig(newConfig) {
    if (this.isStreaming) {
      console.warn('⚠️ Cannot update config while streaming');
      return;
    }
    
    this.streamConfig = { ...this.streamConfig, ...newConfig };
    console.log('✅ Stream configuration updated');
  }
  
  // Get current stream status
  getStatus() {
    return {
      isStreaming: this.isStreaming,
      config: this.streamConfig,
      metrics: this.getHealthMetrics(),
      startTime: this.startTime
    };
  }
  
  // Cleanup resources
  cleanup() {
    this.isStreaming = false;
    this.ffmpegProcess = null;
    this.frameStream = null;
    this.startTime = null;
    this.framesSent = 0;
    this.bytesTransferred = 0;
    this.droppedFrames = 0;
    this.currentBitrate = 0;
    this.lastFrameTime = 0;
  }
  
  // Destroy stream manager
  destroy() {
    console.log('🧹 Destroying stream manager...');
    
    this.stopHealthMonitoring();
    
    if (this.isStreaming) {
      this.stopStream();
    }
    
    this.removeAllListeners();
    console.log('✅ Stream manager destroyed');
  }
}

module.exports = StreamManager;
