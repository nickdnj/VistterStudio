const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

/**
 * MediaProcessor - Handles recording and media processing
 * Manages simultaneous recording while broadcasting
 */
class MediaProcessor extends EventEmitter {
  constructor() {
    super();
    
    // Recording state
    this.isRecording = false;
    this.recordingConfig = null;
    this.recordingProcess = null;
    
    // Recording info
    this.recordingId = null;
    this.recordingStartTime = null;
    this.recordingPath = null;
    
    // Output directory
    this.outputDir = path.join(process.cwd(), 'recordings');
    
    // Ensure output directory exists
    this.initializeOutputDirectory();
    
    console.log('🎥 MediaProcessor initialized');
  }
  
  // Initialize output directory
  async initializeOutputDirectory() {
    try {
      await fs.ensureDir(this.outputDir);
      console.log(`📁 Recording directory: ${this.outputDir}`);
    } catch (error) {
      console.error('❌ Failed to create recording directory:', error);
    }
  }
  
  // Start processing pipeline
  async startProcessing(config) {
    console.log('🎛️ Starting media processing pipeline...');
    
    // Store configuration for potential recording
    this.recordingConfig = {
      resolution: config.resolution || '1920x1080',
      framerate: config.framerate || 30,
      bitrate: config.bitrate || 5000, // Higher bitrate for recording
      format: config.recordingFormat || 'mp4',
      quality: config.recordingQuality || 'high'
    };
    
    console.log('✅ Media processing pipeline started');
    this.emit('processing:started');
  }
  
  // Stop processing pipeline
  async stopProcessing() {
    console.log('⏹️ Stopping media processing pipeline...');
    
    // Stop recording if active
    if (this.isRecording) {
      await this.stopRecording();
    }
    
    this.recordingConfig = null;
    
    console.log('✅ Media processing pipeline stopped');
    this.emit('processing:stopped');
  }
  
  // Start recording
  async startRecording() {
    if (this.isRecording) {
      throw new Error('Recording already active');
    }
    
    if (!this.recordingConfig) {
      throw new Error('Media processor not initialized');
    }
    
    try {
      console.log('🎥 Starting recording...');
      
      // Generate recording info
      this.recordingId = uuidv4();
      this.recordingStartTime = new Date();
      
      const timestamp = this.recordingStartTime.toISOString().replace(/[:.]/g, '-');
      const filename = `recording-${timestamp}.${this.recordingConfig.format}`;
      this.recordingPath = path.join(this.outputDir, filename);
      
      // Setup recording FFmpeg process
      await this.setupRecordingProcess();
      
      this.isRecording = true;
      
      console.log(`✅ Recording started: ${filename}`);
      this.emit('recording:started', {
        id: this.recordingId,
        path: this.recordingPath,
        startTime: this.recordingStartTime
      });
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.cleanupRecording();
      throw error;
    }
  }
  
  // Stop recording
  async stopRecording() {
    if (!this.isRecording) {
      console.log('⚠️ No active recording to stop');
      return;
    }
    
    try {
      console.log('⏹️ Stopping recording...');
      
      this.isRecording = false;
      
      // Gracefully close recording process
      if (this.recordingProcess) {
        this.recordingProcess.kill('SIGTERM');
        
        // Wait for process to finish
        await new Promise((resolve) => {
          if (this.recordingProcess) {
            this.recordingProcess.on('end', resolve);
          } else {
            resolve();
          }
        });
      }
      
      // Get recording info
      const recordingInfo = await this.getRecordingInfo();
      
      console.log(`✅ Recording stopped: ${recordingInfo.filename}`);
      this.emit('recording:stopped', recordingInfo);
      
      this.cleanupRecording();
      
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      this.cleanupRecording();
      throw error;
    }
  }
  
  // Setup FFmpeg process for recording
  async setupRecordingProcess() {
    return new Promise((resolve, reject) => {
      const { resolution, framerate, bitrate, format } = this.recordingConfig;
      const [width, height] = resolution.split('x').map(Number);
      
      console.log(`📹 Setting up recording: ${resolution}@${framerate}fps, ${bitrate}k bitrate`);
      
      // For now, create a placeholder recording process
      // In a complete implementation, this would receive frames from the timeline renderer
      this.recordingProcess = ffmpeg()
        // Input: Test pattern (will be replaced with actual frames)
        .input(`testsrc=duration=3600:size=${width}x${height}:rate=${framerate}`)
        .inputOptions(['-f', 'lavfi'])
        
        // Video encoding for recording (higher quality)
        .videoCodec('libx264')
        .videoBitrate(`${bitrate}k`)
        .size(resolution)
        .fps(framerate)
        .outputOptions([
          '-preset', 'medium', // Better quality for recording
          '-crf', '18', // High quality constant rate factor
          '-pix_fmt', 'yuv420p',
          '-profile:v', 'high',
          '-level', '4.1'
        ])
        
        // Audio (silent for now)
        .audioCodec('aac')
        .audioFrequency(44100)
        .audioChannels(2)
        .audioBitrate('128k')
        .inputOptions(['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'])
        
        // Output format
        .format(format)
        .output(this.recordingPath);
      
      // Event handlers
      this.recordingProcess
        .on('start', (commandLine) => {
          console.log('🚀 Recording FFmpeg started');
          resolve();
        })
        .on('progress', (progress) => {
          this.handleRecordingProgress(progress);
        })
        .on('error', (error) => {
          console.error('❌ Recording FFmpeg error:', error.message);
          this.emit('recording:error', error);
          if (!this.isRecording) {
            reject(error);
          }
        })
        .on('end', () => {
          console.log('🏁 Recording FFmpeg process ended');
          this.emit('recording:ended');
        });
      
      // Start the recording process
      this.recordingProcess.run();
    });
  }
  
  // Handle recording progress updates
  handleRecordingProgress(progress) {
    const recordingDuration = Date.now() - this.recordingStartTime.getTime();
    
    this.emit('recording:progress', {
      duration: recordingDuration,
      frames: progress.frames,
      currentFps: progress.currentFps,
      targetSize: progress.targetSize,
      timemark: progress.timemark
    });
  }
  
  // Get recording information
  async getRecordingInfo() {
    if (!this.recordingPath || !await fs.pathExists(this.recordingPath)) {
      return null;
    }
    
    try {
      const stats = await fs.stat(this.recordingPath);
      const duration = this.recordingStartTime ? Date.now() - this.recordingStartTime.getTime() : 0;
      
      return {
        id: this.recordingId,
        filename: path.basename(this.recordingPath),
        path: this.recordingPath,
        size: stats.size,
        duration: duration,
        startTime: this.recordingStartTime,
        endTime: new Date(),
        format: this.recordingConfig?.format || 'mp4',
        resolution: this.recordingConfig?.resolution || '1920x1080',
        framerate: this.recordingConfig?.framerate || 30
      };
    } catch (error) {
      console.error('❌ Error getting recording info:', error);
      return null;
    }
  }
  
  // List all recordings
  async listRecordings() {
    try {
      const files = await fs.readdir(this.outputDir);
      const recordings = [];
      
      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && this.isVideoFile(file)) {
          recordings.push({
            filename: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          });
        }
      }
      
      // Sort by creation date (newest first)
      recordings.sort((a, b) => b.createdAt - a.createdAt);
      
      return recordings;
    } catch (error) {
      console.error('❌ Error listing recordings:', error);
      return [];
    }
  }
  
  // Check if file is a video file
  isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];
    const ext = path.extname(filename).toLowerCase();
    return videoExtensions.includes(ext);
  }
  
  // Delete recording
  async deleteRecording(filename) {
    try {
      const filePath = path.join(this.outputDir, filename);
      
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(`🗑️ Recording deleted: ${filename}`);
        this.emit('recording:deleted', { filename });
        return true;
      } else {
        console.warn(`⚠️ Recording not found: ${filename}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting recording:', error);
      throw error;
    }
  }
  
  // Get recording statistics
  getRecordingStats() {
    return {
      isRecording: this.isRecording,
      currentRecording: this.isRecording ? {
        id: this.recordingId,
        startTime: this.recordingStartTime,
        duration: Date.now() - (this.recordingStartTime?.getTime() || 0),
        path: this.recordingPath
      } : null,
      outputDirectory: this.outputDir
    };
  }
  
  // Cleanup recording state
  cleanupRecording() {
    this.isRecording = false;
    this.recordingProcess = null;
    this.recordingId = null;
    this.recordingStartTime = null;
    this.recordingPath = null;
  }
  
  // Get processing status
  getStatus() {
    return {
      isProcessing: !!this.recordingConfig,
      isRecording: this.isRecording,
      recordingStats: this.getRecordingStats(),
      outputDirectory: this.outputDir
    };
  }
  
  // Destroy media processor
  destroy() {
    console.log('🧹 Destroying media processor...');
    
    if (this.isRecording) {
      this.stopRecording();
    }
    
    this.removeAllListeners();
    console.log('✅ Media processor destroyed');
  }
}

module.exports = MediaProcessor;
