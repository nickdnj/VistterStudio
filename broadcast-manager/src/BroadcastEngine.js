const ffmpeg = require('fluent-ffmpeg');
const WebRTCBridge = require('./WebRTCBridge');
const axios = require('axios');

class BroadcastEngine {
  constructor({ id, timelineData, streamConfig, onStatusChange, onError }) {
    this.id = id;
    this.timelineData = timelineData;
    this.streamConfig = streamConfig;
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    
    this.ffmpegProcess = null;
    this.webrtcBridges = new Map();
    
    this.status = {
      status: 'offline',
      isStreaming: false,
      uptime: 0,
      startTime: null,
      error: null,
      bitrate: 0,
      fps: 0,
      activeCameras: 0,
      connectedBridges: 0
    };
    
    this.uptimeInterval = null;
  }

  getId() {
    return this.id;
  }

  isStreaming() {
    return this.status.isStreaming;
  }

  getStatus() {
    return {
      ...this.status,
      uptime: this.status.startTime ? Date.now() - this.status.startTime : 0,
      bridges: Array.from(this.webrtcBridges.entries()).map(([name, bridge]) => ({
        camera: name,
        status: bridge.getStatus()
      }))
    };
  }

  async start() {
    try {
      console.log('🚀 Starting v4-only broadcast with WebRTC integration...');
      console.log('Timeline data:', JSON.stringify(this.timelineData, null, 2));

      this.updateStatus({
        status: 'connecting',
        isStreaming: false,
        startTime: Date.now(),
        error: null
      });

      // Get v4 cameras from timeline
      const v4Cameras = await this.getV4CamerasFromTimeline();
      
      if (v4Cameras.length === 0) {
        throw new Error('No Wyze Cam v4 cameras found in timeline. Only v4 cameras (HL_CAM4) are supported for broadcasting.');
      }

      console.log(`📹 Found ${v4Cameras.length} v4 camera(s):`, v4Cameras.map(c => c.nickname));

      // For the initial implementation, we'll use the first v4 camera
      // and attempt to use its WebRTC endpoint directly via the wyze-bridge
      const primaryCamera = v4Cameras[0];
      
      // Try to get a streamable URL for the v4 camera
      const streamUrl = await this.getV4CameraStreamUrl(primaryCamera);
      
      // Start FFmpeg broadcast to YouTube
      await this.startFFmpegBroadcast(streamUrl, primaryCamera);

      this.updateStatus({
        status: 'live',
        isStreaming: true,
        activeCameras: v4Cameras.length
      });

      this.startUptimeTracking();
      console.log('✅ v4 broadcast started successfully');

    } catch (error) {
      console.error('❌ Failed to start v4 broadcast:', error);
      this.updateStatus({
        status: 'error',
        isStreaming: false,
        error: error.message
      });
      
      await this.cleanup();
      throw error;
    }
  }

  async stop() {
    try {
      console.log('🛑 Stopping v4 broadcast...');
      this.updateStatus({ status: 'stopping', isStreaming: false });
      await this.cleanup();
      this.updateStatus({
        status: 'offline',
        isStreaming: false,
        startTime: null,
        uptime: 0
      });
      console.log('✅ v4 broadcast stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping v4 broadcast:', error);
      throw error;
    }
  }

  async getV4CamerasFromTimeline() {
    const v4Cameras = [];
    
    const mainTrack = this.timelineData.tracks.find(track => 
      track.id === 'main' || track.kind === 'video'
    );
    
    if (!mainTrack) {
      throw new Error('No main video track found in timeline');
    }

    const mainClips = this.timelineData.clips.filter(clip => 
      clip.trackId === mainTrack.id && 
      clip.enabled !== false && 
      clip.cameraId && 
      clip.camera
    );

    for (const clip of mainClips) {
      const camera = clip.camera;
      
      if (camera.product_model !== 'HL_CAM4') {
        console.warn(`⚠️ Skipping non-v4 camera: ${camera.nickname} (${camera.product_model})`);
        continue;
      }
      
      if (!v4Cameras.find(c => c.mac === camera.mac)) {
        v4Cameras.push(camera);
      }
    }

    return v4Cameras;
  }

  async getV4CameraStreamUrl(camera) {
    try {
      console.log(`🔍 Getting stream URL for v4 camera: ${camera.nickname} (${camera.name_uri})`);
      
      // For v4 cameras, we have a few options:
      // 1. Try HLS endpoint if available (some v4 cameras still provide it)
      // 2. Use RTSP as fallback
      // 3. Error if neither is available
      
      let streamUrl = null;
      
      // Debug: log the raw camera URLs
      console.log(`🔍 Raw camera URLs for ${camera.nickname}:`, {
        hls_url: camera.hls_url,
        rtsp_url: camera.rtsp_url,
        product_model: camera.product_model
      });

      // Try HLS first (most compatible with FFmpeg)
      if (camera.hls_url) {
        streamUrl = camera.hls_url;
        
        // Replace all localhost references with wyze-bridge container name
        streamUrl = streamUrl.replace(/localhost/g, 'wyze-bridge');
        
        // Ensure we're using the correct internal port (8888 for HLS in wyze-bridge)
        streamUrl = streamUrl.replace(':8889', ':8888'); // External port -> Internal port
        
        console.log(`📡 HLS URL transformation for v4 camera ${camera.nickname}:`);
        console.log(`   Original: ${camera.hls_url}`);
        console.log(`   Final: ${streamUrl}`);
      }
      // Try RTSP as fallback
      else if (camera.rtsp_url) {
        streamUrl = camera.rtsp_url;
        
        // Replace all localhost references with wyze-bridge container name
        streamUrl = streamUrl.replace(/localhost/g, 'wyze-bridge');
        
        // Use internal RTSP port (8554)
        streamUrl = streamUrl.replace(':8555', ':8554'); // External port -> Internal port
        
        console.log(`📡 RTSP URL transformation for v4 camera ${camera.nickname}:`);
        console.log(`   Original: ${camera.rtsp_url}`);
        console.log(`   Final: ${streamUrl}`);
      }
      else {
        throw new Error(`No compatible stream URL found for v4 camera ${camera.nickname}. WebRTC-only cameras require additional bridge implementation.`);
      }
      
      // Test the stream URL
      try {
        console.log(`🧪 Testing stream URL: ${streamUrl}`);
        // For HTTP URLs, test with axios
        if (streamUrl.startsWith('http')) {
          const response = await axios.head(streamUrl, { timeout: 5000 });
          console.log(`✅ Stream URL test passed: ${response.status}`);
        }
      } catch (testError) {
        console.warn(`⚠️ Stream URL test failed, but proceeding: ${testError.message}`);
      }
      
      return streamUrl;
      
    } catch (error) {
      console.error(`❌ Failed to get stream URL for ${camera.nickname}:`, error);
      throw error;
    }
  }

  async startFFmpegBroadcast(inputSource, camera) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🎬 Starting FFmpeg broadcast for v4 camera: ${camera.nickname}`);
        console.log(`📡 Input source: ${inputSource}`);
        console.log(`📺 Output: ${this.streamConfig.rtmpUrl}/${this.streamConfig.streamKey}`);

        this.ffmpegProcess = ffmpeg(inputSource)
          .inputOptions([
            '-re', // Read input at native frame rate
            '-stream_loop', '-1', // Loop input indefinitely
            '-fflags', '+genpts', // Generate timestamps
            '-timeout', '10000000' // 10 second timeout for network operations
          ])
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            '-g', '60', // Keyframe every 2 seconds (30fps * 2)
            '-keyint_min', '60',
            '-sc_threshold', '0',
            '-b:v', '2500k', // Video bitrate
            '-maxrate', '2500k',
            '-bufsize', '5000k',
            '-b:a', '128k', // Audio bitrate
            '-ar', '44100',
            '-ac', '2', // Stereo audio
            '-f', 'flv' // Output format for RTMP
          ])
          .output(`${this.streamConfig.rtmpUrl}/${this.streamConfig.streamKey}`)
          .on('start', (commandLine) => {
            console.log('🎯 FFmpeg v4 broadcast command:', commandLine);
            resolve();
          })
          .on('progress', (progress) => {
            this.updateStatus({
              fps: progress.currentFps || 0,
              bitrate: progress.currentKbps || 0
            });
            
            // Log progress every 30 seconds
            if (progress.timemark && progress.timemark.includes(':30') || progress.timemark.includes(':00')) {
              console.log(`📊 Broadcast progress for ${camera.nickname}: ${progress.timemark}, FPS: ${progress.currentFps}, Bitrate: ${progress.currentKbps}k`);
            }
          })
          .on('error', (error) => {
            console.error(`❌ FFmpeg v4 broadcast error for ${camera.nickname}:`, error);
            this.updateStatus({
              status: 'error',
              isStreaming: false,
              error: `FFmpeg error: ${error.message}`
            });
            this.onError(error);
            reject(error);
          })
          .on('end', () => {
            console.log(`📴 FFmpeg v4 broadcast ended for ${camera.nickname}`);
            this.updateStatus({
              status: 'offline',
              isStreaming: false
            });
          });

        // Start the FFmpeg process
        this.ffmpegProcess.run();

      } catch (error) {
        reject(error);
      }
    });
  }

  async updateTimeline(newTimelineData) {
    try {
      console.log('🔄 Updating timeline for v4 broadcast...');
      this.timelineData = newTimelineData;
      
      if (this.isStreaming()) {
        console.log('📺 Restarting v4 broadcast with new timeline...');
        await this.stop();
        await this.start();
      }
      
      console.log('✅ v4 timeline updated successfully');
    } catch (error) {
      console.error('❌ Error updating v4 timeline:', error);
      throw error;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up v4 broadcast resources...');
    
    // Stop FFmpeg process
    if (this.ffmpegProcess) {
      try {
        this.ffmpegProcess.kill('SIGINT');
        this.ffmpegProcess = null;
        console.log('✅ FFmpeg process stopped');
      } catch (error) {
        console.error('❌ Error stopping FFmpeg:', error);
      }
    }

    // Stop all WebRTC bridges
    for (const [cameraName, bridge] of this.webrtcBridges) {
      try {
        await bridge.stop();
        console.log(`✅ WebRTC bridge stopped for ${cameraName}`);
      } catch (error) {
        console.error(`❌ Error stopping bridge for ${cameraName}:`, error);
      }
    }
    this.webrtcBridges.clear();

    // Stop uptime tracking
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }
  }

  updateStatus(updates) {
    this.status = { ...this.status, ...updates };
    console.log('📊 v4 Broadcast Engine status:', this.status);
    
    if (this.onStatusChange) {
      this.onStatusChange(this.status);
    }
  }

  startUptimeTracking() {
    this.uptimeInterval = setInterval(() => {
      // Uptime calculated in getStatus()
    }, 1000);
  }
}

module.exports = BroadcastEngine;