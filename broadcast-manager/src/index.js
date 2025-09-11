const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const BroadcastEngine = require('./BroadcastEngine');
const RTMPProxy = require('./RTMPProxy');

const app = express();
const PORT = process.env.PORT || 19001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global broadcast engine instance
let broadcastEngine = null;

// Global RTMP proxy for preview streams
let rtmpProxy = null;

// Initialize RTMP proxy on startup
async function initializeRTMPProxy() {
  try {
    rtmpProxy = new RTMPProxy({ port: 1936, hlsPort: 8081 });
    await rtmpProxy.start();
    console.log('✅ RTMP-to-HLS proxy initialized for camera previews');
  } catch (error) {
    console.error('❌ Failed to initialize RTMP proxy:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'VistterStudio Broadcast Manager',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get broadcast status
app.get('/api/broadcast/status', (req, res) => {
  if (!broadcastEngine) {
    return res.json({
      status: 'offline',
      isStreaming: false,
      uptime: 0,
      error: null
    });
  }

  res.json(broadcastEngine.getStatus());
});

// Start broadcast
app.post('/api/broadcast/start', async (req, res) => {
  try {
    const { timelineData, streamConfig } = req.body;

    // Validate required fields
    if (!timelineData || !streamConfig) {
      return res.status(400).json({
        error: 'Missing required fields: timelineData and streamConfig'
      });
    }

    if (!streamConfig.rtmpUrl || !streamConfig.streamKey) {
      return res.status(400).json({
        error: 'Missing RTMP URL or Stream Key'
      });
    }

    // Stop existing broadcast if running
    if (broadcastEngine && broadcastEngine.isStreaming()) {
      console.log('Stopping existing broadcast...');
      await broadcastEngine.stop();
    }

    // Create new broadcast engine
    broadcastEngine = new BroadcastEngine({
      id: uuidv4(),
      timelineData,
      streamConfig,
      onStatusChange: (status) => {
        console.log('Broadcast status changed:', status);
        // TODO: Implement WebSocket to notify frontend of status changes
      },
      onError: (error) => {
        console.error('Broadcast error:', error);
      }
    });

    // Start the broadcast
    await broadcastEngine.start();

    res.json({
      message: 'Broadcast started successfully',
      broadcastId: broadcastEngine.getId(),
      status: broadcastEngine.getStatus()
    });

  } catch (error) {
    console.error('Error starting broadcast:', error);
    res.status(500).json({
      error: 'Failed to start broadcast',
      details: error.message
    });
  }
});

// Stop broadcast
app.post('/api/broadcast/stop', async (req, res) => {
  try {
    if (!broadcastEngine || !broadcastEngine.isStreaming()) {
      return res.status(400).json({
        error: 'No active broadcast to stop'
      });
    }

    await broadcastEngine.stop();
    broadcastEngine = null;

    res.json({
      message: 'Broadcast stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping broadcast:', error);
    res.status(500).json({
      error: 'Failed to stop broadcast',
      details: error.message
    });
  }
});

// Update timeline during live broadcast
app.post('/api/broadcast/update-timeline', async (req, res) => {
  try {
    const { timelineData } = req.body;

    if (!broadcastEngine || !broadcastEngine.isStreaming()) {
      return res.status(400).json({
        error: 'No active broadcast to update'
      });
    }

    await broadcastEngine.updateTimeline(timelineData);

    res.json({
      message: 'Timeline updated successfully',
      status: broadcastEngine.getStatus()
    });

  } catch (error) {
    console.error('Error updating timeline:', error);
    res.status(500).json({
      error: 'Failed to update timeline',
      details: error.message
    });
  }
});

// Start RTMP camera preview
app.post('/api/preview/rtmp/start', async (req, res) => {
  try {
    const { rtmpUrl, streamKey } = req.body;

    if (!rtmpUrl || !streamKey) {
      return res.status(400).json({
        error: 'RTMP URL and stream key are required'
      });
    }

    if (!rtmpProxy) {
      return res.status(503).json({
        error: 'RTMP proxy not available'
      });
    }

    // Start FFmpeg process to pull RTMP stream and push to our proxy
    const ffmpegProcess = ffmpeg(rtmpUrl)
      .inputOptions([
        '-re',
        '-timeout', '10000000'
      ])
      .videoCodec('copy') // Don't re-encode for preview
      .audioCodec('copy')
      .outputOptions([
        '-f', 'flv'
      ])
      .output(`rtmp://localhost:${rtmpProxy.port}/live/${streamKey}`)
      .on('start', (commandLine) => {
        console.log(`🎬 RTMP preview started for ${streamKey}:`, commandLine);
      })
      .on('error', (error) => {
        console.error(`❌ RTMP preview error for ${streamKey}:`, error);
      })
      .on('end', () => {
        console.log(`📴 RTMP preview ended for ${streamKey}`);
      });

    ffmpegProcess.run();

    // Store the process for cleanup
    rtmpProxy.activeStreams.set(`preview_${streamKey}`, ffmpegProcess);

    const hlsUrl = `http://localhost:8081/${streamKey}/index.m3u8`;

    res.json({
      message: 'RTMP preview started',
      streamKey,
      hlsUrl,
      rtmpInput: rtmpUrl
    });

  } catch (error) {
    console.error('Error starting RTMP preview:', error);
    res.status(500).json({
      error: 'Failed to start RTMP preview',
      details: error.message
    });
  }
});

// Stop RTMP camera preview
app.post('/api/preview/rtmp/stop', async (req, res) => {
  try {
    const { streamKey } = req.body;

    if (!streamKey) {
      return res.status(400).json({
        error: 'Stream key is required'
      });
    }

    if (!rtmpProxy) {
      return res.status(503).json({
        error: 'RTMP proxy not available'
      });
    }

    const previewKey = `preview_${streamKey}`;
    const ffmpegProcess = rtmpProxy.activeStreams.get(previewKey);
    
    if (ffmpegProcess) {
      ffmpegProcess.kill('SIGTERM');
      rtmpProxy.activeStreams.delete(previewKey);
      console.log(`✅ RTMP preview stopped for ${streamKey}`);
    }

    res.json({
      message: 'RTMP preview stopped',
      streamKey
    });

  } catch (error) {
    console.error('Error stopping RTMP preview:', error);
    res.status(500).json({
      error: 'Failed to stop RTMP preview',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down broadcast manager...');
  
  if (broadcastEngine && broadcastEngine.isStreaming()) {
    try {
      await broadcastEngine.stop();
    } catch (error) {
      console.error('Error stopping broadcast during shutdown:', error);
    }
  }
  
  process.exit(0);
});

app.listen(PORT, async () => {
  console.log(`🚀 VistterStudio Broadcast Manager running on port ${PORT}`);
  console.log(`📺 Ready to handle live streaming requests`);
  
  // Initialize RTMP proxy for camera previews
  await initializeRTMPProxy();
});
