const NodeMediaServer = require('node-media-server');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

class RTMPProxy {
  constructor({ port = 1936, hlsPort = 8080 }) {
    this.port = port;
    this.hlsPort = hlsPort;
    this.mediaServer = null;
    this.activeStreams = new Map(); // Map of streamKey -> ffmpeg process
    this.hlsPath = '/tmp/hls'; // Temporary HLS output directory
    
    // Ensure HLS directory exists
    if (!fs.existsSync(this.hlsPath)) {
      fs.mkdirSync(this.hlsPath, { recursive: true });
    }
  }

  async start() {
    try {
      console.log(`🚀 Starting RTMP-to-HLS proxy on port ${this.port}`);
      
      const config = {
        rtmp: {
          port: this.port,
          chunk_size: 60000,
          gop_cache: true,
          ping: 30,
          ping_timeout: 60
        },
        http: {
          port: this.hlsPort,
          allow_origin: '*',
          mediaroot: this.hlsPath
        }
      };

      this.mediaServer = new NodeMediaServer(config);

      // Handle incoming RTMP streams
      this.mediaServer.on('preConnect', (id, args) => {
        console.log(`📡 RTMP client connecting: ${id}`);
      });

      this.mediaServer.on('postConnect', (id, args) => {
        console.log(`✅ RTMP client connected: ${id}`);
      });

      this.mediaServer.on('prePublish', (id, StreamPath, args) => {
        console.log(`📤 RTMP stream publishing: ${StreamPath}`);
        this.startHLSConversion(StreamPath);
      });

      this.mediaServer.on('donePublish', (id, StreamPath, args) => {
        console.log(`📴 RTMP stream ended: ${StreamPath}`);
        this.stopHLSConversion(StreamPath);
      });

      this.mediaServer.run();
      
      console.log(`✅ RTMP-to-HLS proxy started:`);
      console.log(`   📡 RTMP input: rtmp://localhost:${this.port}/live/<stream_key>`);
      console.log(`   📺 HLS output: http://localhost:${this.hlsPort}/<stream_key>/index.m3u8`);
      
    } catch (error) {
      console.error('❌ Failed to start RTMP proxy:', error);
      throw error;
    }
  }

  async stop() {
    try {
      console.log('🛑 Stopping RTMP-to-HLS proxy...');
      
      // Stop all active HLS conversions
      for (const [streamKey, ffmpegProcess] of this.activeStreams) {
        try {
          ffmpegProcess.kill('SIGTERM');
          console.log(`✅ Stopped HLS conversion for ${streamKey}`);
        } catch (error) {
          console.error(`❌ Error stopping HLS conversion for ${streamKey}:`, error);
        }
      }
      this.activeStreams.clear();

      // Stop media server
      if (this.mediaServer) {
        this.mediaServer.stop();
        this.mediaServer = null;
      }
      
      console.log('✅ RTMP-to-HLS proxy stopped');
      
    } catch (error) {
      console.error('❌ Error stopping RTMP proxy:', error);
      throw error;
    }
  }

  startHLSConversion(streamPath) {
    try {
      // Extract stream key from path (e.g., "/live/camera1" -> "camera1")
      const streamKey = streamPath.split('/').pop();
      const inputUrl = `rtmp://localhost:${this.port}${streamPath}`;
      const outputDir = path.join(this.hlsPath, streamKey);
      const outputPath = path.join(outputDir, 'index.m3u8');

      console.log(`🔄 Starting HLS conversion for ${streamKey}`);
      console.log(`   Input: ${inputUrl}`);
      console.log(`   Output: ${outputPath}`);

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Start FFmpeg HLS conversion
      const ffmpegProcess = ffmpeg(inputUrl)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset', 'veryfast',
          '-g', '60', // GOP size
          '-sc_threshold', '0',
          '-f', 'hls',
          '-hls_time', '2', // 2-second segments
          '-hls_list_size', '10', // Keep 10 segments
          '-hls_flags', 'delete_segments', // Clean up old segments
          '-hls_allow_cache', '0'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log(`✅ HLS conversion started for ${streamKey}`);
        })
        .on('progress', (progress) => {
          // Log progress occasionally
          if (progress.timemark && progress.timemark.includes(':00')) {
            console.log(`📊 HLS conversion progress for ${streamKey}: ${progress.timemark}`);
          }
        })
        .on('error', (error) => {
          console.error(`❌ HLS conversion error for ${streamKey}:`, error);
          this.activeStreams.delete(streamKey);
        })
        .on('end', () => {
          console.log(`📴 HLS conversion ended for ${streamKey}`);
          this.activeStreams.delete(streamKey);
        });

      // Start the conversion
      ffmpegProcess.run();
      
      // Store the process for later cleanup
      this.activeStreams.set(streamKey, ffmpegProcess);
      
    } catch (error) {
      console.error(`❌ Failed to start HLS conversion for ${streamPath}:`, error);
    }
  }

  stopHLSConversion(streamPath) {
    const streamKey = streamPath.split('/').pop();
    const ffmpegProcess = this.activeStreams.get(streamKey);
    
    if (ffmpegProcess) {
      try {
        ffmpegProcess.kill('SIGTERM');
        this.activeStreams.delete(streamKey);
        console.log(`✅ Stopped HLS conversion for ${streamKey}`);
      } catch (error) {
        console.error(`❌ Error stopping HLS conversion for ${streamKey}:`, error);
      }
    }
  }

  getHLSUrl(streamKey) {
    return `http://localhost:${this.hlsPort}/${streamKey}/index.m3u8`;
  }

  isStreamActive(streamKey) {
    return this.activeStreams.has(streamKey);
  }

  getActiveStreams() {
    return Array.from(this.activeStreams.keys());
  }
}

module.exports = RTMPProxy;
