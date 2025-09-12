const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const BroadcastEngine = require('./src/BroadcastEngine');
const TimelineRenderer = require('./src/TimelineRenderer');
const StreamManager = require('./src/StreamManager');
const MediaProcessor = require('./src/MediaProcessor');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Global broadcast state
let broadcastEngine = null;
let timelineRenderer = null;
let streamManager = null;
let mediaProcessor = null;

// Initialize broadcast services
async function initializeBroadcastServices() {
  try {
    console.log('🚀 Initializing VistterStudio Broadcast Server...');
    
    // Create broadcast engine
    broadcastEngine = new BroadcastEngine();
    
    // Create timeline renderer
    timelineRenderer = new TimelineRenderer({
      width: 1920,
      height: 1080,
      framerate: 30
    });
    
    // Create stream manager
    streamManager = new StreamManager();
    
    // Create media processor
    mediaProcessor = new MediaProcessor();
    
    // Connect components
    broadcastEngine.setTimelineRenderer(timelineRenderer);
    broadcastEngine.setStreamManager(streamManager);
    broadcastEngine.setMediaProcessor(mediaProcessor);
    
    console.log('✅ Broadcast services initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize broadcast services:', error);
    process.exit(1);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);
  
  // Send current broadcast status
  socket.emit('broadcast:status', broadcastEngine?.getStatus() || {
    isLive: false,
    isRecording: false,
    uptime: 0,
    viewers: 0,
    bitrate: 0
  });
  
  // Timeline control events
  socket.on('timeline:update', (timelineData) => {
    console.log('📝 Timeline updated');
    if (broadcastEngine) {
      broadcastEngine.updateTimeline(timelineData);
    }
    // Broadcast to all connected clients
    socket.broadcast.emit('timeline:updated', timelineData);
  });
  
  socket.on('playback:play', () => {
    console.log('▶️ Playback started');
    if (broadcastEngine) {
      broadcastEngine.play();
    }
    socket.broadcast.emit('playback:playing');
  });
  
  socket.on('playback:pause', () => {
    console.log('⏸️ Playback paused');
    if (broadcastEngine) {
      broadcastEngine.pause();
    }
    socket.broadcast.emit('playback:paused');
  });
  
  socket.on('playback:seek', (timeMs) => {
    console.log('⏭️ Seeking to:', timeMs);
    if (broadcastEngine) {
      broadcastEngine.seekTo(timeMs);
    }
    socket.broadcast.emit('playback:seeked', timeMs);
  });
  
  // Broadcast control events
  socket.on('broadcast:start', async (config) => {
    console.log('🔴 Starting broadcast with config:', config);
    try {
      if (broadcastEngine) {
        await broadcastEngine.startBroadcast(config);
        io.emit('broadcast:started', broadcastEngine.getStatus());
      }
    } catch (error) {
      console.error('❌ Failed to start broadcast:', error);
      socket.emit('broadcast:error', { message: error.message });
    }
  });
  
  socket.on('broadcast:stop', async () => {
    console.log('⏹️ Stopping broadcast');
    try {
      if (broadcastEngine) {
        await broadcastEngine.stopBroadcast();
        io.emit('broadcast:stopped', broadcastEngine.getStatus());
      }
    } catch (error) {
      console.error('❌ Failed to stop broadcast:', error);
      socket.emit('broadcast:error', { message: error.message });
    }
  });
  
  socket.on('recording:start', async () => {
    console.log('🎥 Starting recording');
    try {
      if (broadcastEngine) {
        await broadcastEngine.startRecording();
        io.emit('recording:started', broadcastEngine.getStatus());
      }
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      socket.emit('recording:error', { message: error.message });
    }
  });
  
  socket.on('recording:stop', async () => {
    console.log('⏹️ Stopping recording');
    try {
      if (broadcastEngine) {
        await broadcastEngine.stopRecording();
        io.emit('recording:stopped', broadcastEngine.getStatus());
      }
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      socket.emit('recording:error', { message: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// REST API Routes

// Get broadcast status
app.get('/api/broadcast/status', (req, res) => {
  const status = broadcastEngine?.getStatus() || {
    isLive: false,
    isRecording: false,
    uptime: 0,
    viewers: 0,
    bitrate: 0
  };
  res.json(status);
});

// Get stream health metrics
app.get('/api/broadcast/health', (req, res) => {
  const health = streamManager?.getHealthMetrics() || {
    connectionStatus: 'disconnected',
    droppedFrames: 0,
    averageBitrate: 0,
    bufferHealth: 0
  };
  res.json(health);
});

// Configure stream settings
app.post('/api/broadcast/config', (req, res) => {
  try {
    const config = req.body;
    if (streamManager) {
      streamManager.updateConfig(config);
    }
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available streaming platforms
app.get('/api/broadcast/platforms', (req, res) => {
  res.json([
    {
      id: 'youtube',
      name: 'YouTube Live',
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2/',
      requiresStreamKey: true,
      maxBitrate: 8000,
      supportedResolutions: ['1920x1080', '1280x720', '854x480']
    },
    {
      id: 'twitch',
      name: 'Twitch',
      rtmpUrl: 'rtmp://live.twitch.tv/live/',
      requiresStreamKey: true,
      maxBitrate: 6000,
      supportedResolutions: ['1920x1080', '1280x720']
    },
    {
      id: 'facebook',
      name: 'Facebook Live',
      rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
      requiresStreamKey: true,
      maxBitrate: 4000,
      supportedResolutions: ['1920x1080', '1280x720']
    },
    {
      id: 'custom',
      name: 'Custom RTMP',
      rtmpUrl: 'custom',
      requiresStreamKey: true,
      maxBitrate: 10000,
      supportedResolutions: ['1920x1080', '1280x720', '854x480']
    }
  ]);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      broadcastEngine: !!broadcastEngine,
      timelineRenderer: !!timelineRenderer,
      streamManager: !!streamManager,
      mediaProcessor: !!mediaProcessor
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initializeBroadcastServices();
    
    server.listen(PORT, () => {
      console.log('🎬 VistterStudio Broadcast Server running on port', PORT);
      console.log('📡 WebSocket server ready for timeline sync');
      console.log('🔴 Ready for live broadcasting!');
    });
    
    // Broadcast status updates every 5 seconds
    setInterval(() => {
      if (broadcastEngine) {
        const status = broadcastEngine.getStatus();
        io.emit('broadcast:status', status);
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to start broadcast server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down broadcast server...');
  if (broadcastEngine) {
    await broadcastEngine.stopBroadcast();
    await broadcastEngine.stopRecording();
  }
  server.close(() => {
    console.log('✅ Broadcast server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down...');
  if (broadcastEngine) {
    await broadcastEngine.stopBroadcast();
    await broadcastEngine.stopRecording();
  }
  server.close(() => {
    console.log('✅ Broadcast server shut down gracefully');
    process.exit(0);
  });
});

startServer();
