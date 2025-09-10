const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

class BroadcastEngine {
  constructor({ id, timelineData, streamConfig, onStatusChange, onError }) {
    this.id = id;
    this.timelineData = timelineData;
    this.streamConfig = streamConfig;
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    
    this.ffmpegProcess = null;
    this.status = {
      status: 'offline',
      isStreaming: false,
      uptime: 0,
      startTime: null,
      error: null,
      bitrate: 0,
      fps: 0
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
      uptime: this.status.startTime ? Date.now() - this.status.startTime : 0
    };
  }

  async start() {
    try {
      console.log('Starting broadcast with timeline:', this.timelineData);
      console.log('Stream config:', this.streamConfig);

      this.updateStatus({
        status: 'connecting',
        isStreaming: false,
        startTime: Date.now(),
        error: null
      });

      // Build FFmpeg command for live streaming
      await this.buildFFmpegCommand();

      this.updateStatus({
        status: 'live',
        isStreaming: true
      });

      // Start uptime tracking
      this.startUptimeTracking();

      console.log('✅ Broadcast started successfully');

    } catch (error) {
      console.error('❌ Failed to start broadcast:', error);
      this.updateStatus({
        status: 'error',
        isStreaming: false,
        error: error.message
      });
      throw error;
    }
  }

  async stop() {
    try {
      console.log('Stopping broadcast...');

      this.updateStatus({
        status: 'stopping',
        isStreaming: false
      });

      // Stop FFmpeg process
      if (this.ffmpegProcess) {
        this.ffmpegProcess.kill('SIGINT');
        this.ffmpegProcess = null;
      }

      // Stop uptime tracking
      if (this.uptimeInterval) {
        clearInterval(this.uptimeInterval);
        this.uptimeInterval = null;
      }

      this.updateStatus({
        status: 'offline',
        isStreaming: false,
        startTime: null,
        uptime: 0
      });

      console.log('✅ Broadcast stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping broadcast:', error);
      this.updateStatus({
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }

  async updateTimeline(newTimelineData) {
    try {
      console.log('Updating timeline during live broadcast...');
      this.timelineData = newTimelineData;
      
      // For now, we'll restart the stream with new timeline
      // In a more advanced implementation, we could hot-swap the timeline
      if (this.isStreaming()) {
        await this.stop();
        await this.start();
      }
      
      console.log('✅ Timeline updated successfully');
    } catch (error) {
      console.error('❌ Error updating timeline:', error);
      throw error;
    }
  }

  async buildFFmpegCommand() {
    return new Promise((resolve, reject) => {
      try {
        // Get the main track for primary video source
        const mainTrack = this.timelineData.tracks.find(track => 
          track.id === 'main' || track.kind === 'video'
        );
        
        if (!mainTrack) {
          throw new Error('No main video track found in timeline');
        }

        // Get main track clips
        const mainClips = this.timelineData.clips.filter(clip => 
          clip.trackId === mainTrack.id && clip.enabled !== false
        );

        if (mainClips.length === 0) {
          throw new Error('No video clips found on main track');
        }

        // For now, we'll stream the first camera/video source
        // TODO: Implement complex timeline composition
        const firstClip = mainClips[0];
        let inputSource;

        if (firstClip.cameraId) {
          // Use camera stream
          const cameraUrl = this.getCameraStreamUrl(firstClip.camera);
          inputSource = cameraUrl;
        } else if (firstClip.asset && firstClip.asset.category === 'videos') {
          // Use video asset
          inputSource = `http://localhost:18080${firstClip.asset.url}`;
        } else {
          throw new Error('Unsupported clip type for broadcasting');
        }

        console.log('Using input source:', inputSource);

        // Create FFmpeg command
        this.ffmpegProcess = ffmpeg(inputSource)
          .inputOptions([
            '-re', // Read input at native frame rate
            '-stream_loop', '-1' // Loop input indefinitely
          ])
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            '-g', '60', // Keyframe interval
            '-keyint_min', '60',
            '-sc_threshold', '0',
            '-b:v', '2500k', // Video bitrate
            '-maxrate', '2500k',
            '-bufsize', '5000k',
            '-b:a', '128k', // Audio bitrate
            '-ar', '44100',
            '-f', 'flv' // Output format for RTMP
          ])
          .output(`${this.streamConfig.rtmpUrl}/${this.streamConfig.streamKey}`)
          .on('start', (commandLine) => {
            console.log('FFmpeg started:', commandLine);
            resolve();
          })
          .on('progress', (progress) => {
            this.updateStatus({
              fps: progress.currentFps || 0,
              bitrate: progress.currentKbps || 0
            });
          })
          .on('error', (error) => {
            console.error('FFmpeg error:', error);
            this.updateStatus({
              status: 'error',
              isStreaming: false,
              error: error.message
            });
            this.onError(error);
            reject(error);
          })
          .on('end', () => {
            console.log('FFmpeg process ended');
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

  getCameraStreamUrl(camera) {
    if (!camera) return '';
    
    // Check if this is a v4 camera that needs WebRTC
    const isV4Camera = camera.product_model === 'HL_CAM4';
    
    if (isV4Camera) {
      // For v4 cameras, use the HLS fallback for FFmpeg
      return camera.hls_url?.replace('wyze-bridge:', 'localhost:').replace(':8889', ':18889');
    }
    
    // Convert internal URLs to external accessible URLs
    const url = camera.hls_url || camera.rtsp_url || '';
    return url.replace('wyze-bridge:', 'localhost:')
      .replace(':8889', ':18889') // HLS port
      .replace(':8555', ':18555'); // RTSP port
  }

  updateStatus(updates) {
    this.status = { ...this.status, ...updates };
    if (this.onStatusChange) {
      this.onStatusChange(this.status);
    }
  }

  startUptimeTracking() {
    this.uptimeInterval = setInterval(() => {
      // Uptime is calculated in getStatus(), no need to update here
    }, 1000);
  }
}

module.exports = BroadcastEngine;
