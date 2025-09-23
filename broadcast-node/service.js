const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const {
  SEGMENT_ID_PATTERN,
  SegmentValidationError,
  normalizeSegmentId,
  resolveSegmentPath,
} = require('@vistterstudio/shared/utils/segments');

const app = express();
const PORT = process.env.PORT || 5000;

const resolveSegmentsPath = () => {
  const configured = process.env.SEGMENTS_PATH || '/app/data/segments';
  const resolved = path.resolve(configured);
  fs.ensureDirSync(resolved);
  return resolved;
};

const segmentsPath = resolveSegmentsPath();
const youtubeRtmpUrl = process.env.YOUTUBE_RTMP_URL || 'rtmp://a.rtmp.youtube.com/live2';
const youtubeStreamKey = process.env.YOUTUBE_STREAM_KEY;

const handleSegmentError = (res, error, fallbackMessage) => {
  if (error instanceof SegmentValidationError) {
    return res.status(400).json({ error: 'Invalid segment id' });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

// Middleware
app.use(express.json());
app.use(express.static('public'));

// State
let currentProcess = null;
let currentSegment = null;
let isStreaming = false;

// FFmpeg streaming function
const startStreaming = (segment) => {
  if (isStreaming) {
    console.log('Already streaming, stopping current stream first');
    stopStreaming();
  }

  if (!youtubeStreamKey) {
    console.error('YouTube stream key not provided. Set YOUTUBE_STREAM_KEY environment variable.');
    return false;
  }

  console.log('Starting stream with segment:', segment.name);
  
  // Find the first video track with clips
  const videoTrack = segment.tracks.find(track => track.type === 'video');
  if (!videoTrack || !videoTrack.clips.length) {
    console.error('No video track or clips found in segment');
    return false;
  }

  const clip = videoTrack.clips[0];
  const inputUrl = clip.asset.path;
  
  console.log(`Input stream: ${inputUrl}`);
  console.log(`Output stream: ${youtubeRtmpUrl}/${youtubeStreamKey}`);

  // FFmpeg command for streaming to YouTube Live
  const ffmpegArgs = [
    '-i', inputUrl,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-maxrate', '3000k',
    '-bufsize', '6000k',
    '-pix_fmt', 'yuv420p',
    '-g', '50',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-ac', '2',
    '-ar', '44100',
    '-f', 'flv',
    `${youtubeRtmpUrl}/${youtubeStreamKey}`
  ];

  console.log('FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

  currentProcess = spawn('ffmpeg', ffmpegArgs);
  isStreaming = true;
  currentSegment = {
    id: segment.id,
    name: segment.name,
    duration: segment.duration,
  };

  currentProcess.stdout.on('data', (data) => {
    console.log(`FFmpeg stdout: ${data}`);
  });

  currentProcess.stderr.on('data', (data) => {
    console.log(`FFmpeg stderr: ${data}`);
  });

  currentProcess.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    isStreaming = false;
    currentProcess = null;
    currentSegment = null;
  });

  currentProcess.on('error', (err) => {
    console.error('FFmpeg process error:', err);
    isStreaming = false;
    currentProcess = null;
    currentSegment = null;
  });

  return true;
};

const stopStreaming = () => {
  if (currentProcess) {
    console.log('Stopping current stream...');
    currentProcess.kill('SIGTERM');
    currentProcess = null;
    isStreaming = false;
    currentSegment = null;
  }
};

// API Routes

// Get available segments
app.get('/api/segments', async (req, res) => {
  try {
    const files = await fs.readdir(segmentsPath);
    const segments = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const segmentId = path.basename(file, '.json');

        if (!SEGMENT_ID_PATTERN.test(segmentId)) {
          continue;
        }

        const segmentPath = path.resolve(segmentsPath, file);
        const segmentData = await fs.readJson(segmentPath);
        segments.push({
          id: segmentId,
          filename: file,
          ...segmentData
        });
      }
    }
    
    res.json(segments);
  } catch (error) {
    console.error('Error reading segments:', error);
    res.status(500).json({ error: 'Failed to read segments' });
  }
});

// Get specific segment
app.get('/api/segments/:id', async (req, res) => {
  try {
    const { filePath } = resolveSegmentPath(segmentsPath, req.params.id);

    if (await fs.pathExists(filePath)) {
      const segmentData = await fs.readJson(filePath);
      res.json(segmentData);
    } else {
      res.status(404).json({ error: 'Segment not found' });
    }
  } catch (error) {
    handleSegmentError(res, error, 'Failed to read segment');
  }
});

// Start streaming a segment
app.post('/api/stream/start/:segmentId', async (req, res) => {
  try {
    const { id: segmentId, filePath } = resolveSegmentPath(segmentsPath, req.params.segmentId);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const segment = await fs.readJson(filePath);
    const success = startStreaming({ id: segmentId, ...segment });
    
    if (success) {
      res.json({ success: true, message: 'Streaming started', segment: segment.name });
    } else {
      res.status(500).json({ error: 'Failed to start streaming' });
    }
  } catch (error) {
    handleSegmentError(res, error, 'Failed to start streaming');
  }
});

// Stop streaming
app.post('/api/stream/stop', (req, res) => {
  stopStreaming();
  res.json({ success: true, message: 'Streaming stopped' });
});

// Get streaming status
app.get('/api/stream/status', (req, res) => {
  res.json({
    isStreaming,
    currentSegment: currentSegment ? {
      id: currentSegment.id,
      name: currentSegment.name,
      duration: currentSegment.duration
    } : null,
    youtubeStreamKey: youtubeStreamKey ? '***configured***' : 'not configured'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'broadcast-node',
    timestamp: new Date().toISOString(),
    isStreaming,
    segmentsPath
  });
});

// Simple web UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>VistterStudio Broadcast Node</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; margin: 20px 0; border-radius: 5px; }
        .status.streaming { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .status.stopped { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .segment { padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
        .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
        .btn-primary { background: #007bff; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        h1 { color: #333; }
        .config { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎥 VistterStudio Broadcast Node</h1>
        
        <div class="config">
          <h3>Configuration</h3>
          <p><strong>Segments Path:</strong> ${segmentsPath}</p>
          <p><strong>YouTube Stream Key:</strong> ${youtubeStreamKey ? '***configured***' : '❌ Not configured'}</p>
          <p><strong>YouTube RTMP URL:</strong> ${youtubeRtmpUrl}</p>
        </div>

        <div id="status" class="status stopped">
          <strong>Status:</strong> <span id="status-text">Stopped</span>
        </div>

        <div>
          <h3>Available Segments</h3>
          <div id="segments"></div>
        </div>

        <div>
          <button id="refresh-btn" class="btn btn-primary">Refresh Segments</button>
          <button id="stop-btn" class="btn btn-danger" disabled>Stop Streaming</button>
        </div>
      </div>

      <script>
        let currentSegment = null;

        async function loadSegments() {
          try {
            const response = await fetch('/api/segments');
            const segments = await response.json();
            
            const segmentsDiv = document.getElementById('segments');
            segmentsDiv.innerHTML = '';
            
            segments.forEach(segment => {
              const segmentDiv = document.createElement('div');
              segmentDiv.className = 'segment';
              segmentDiv.innerHTML = \`
                <h4>\${segment.name || segment.id}</h4>
                <p>Duration: \${segment.duration}s | Created: \${new Date(segment.created).toLocaleString()}</p>
                <button class="btn btn-success" onclick="startStream('\${segment.id}')">Start Stream</button>
              \`;
              segmentsDiv.appendChild(segmentDiv);
            });
          } catch (error) {
            console.error('Error loading segments:', error);
          }
        }

        async function startStream(segmentId) {
          try {
            const response = await fetch(\`/api/stream/start/\${segmentId}\`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
              currentSegment = segmentId;
              updateStatus('Streaming', true);
              document.getElementById('stop-btn').disabled = false;
              alert('Stream started successfully!');
            } else {
              alert('Failed to start stream: ' + result.error);
            }
          } catch (error) {
            console.error('Error starting stream:', error);
            alert('Error starting stream');
          }
        }

        async function stopStream() {
          try {
            const response = await fetch('/api/stream/stop', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
              currentSegment = null;
              updateStatus('Stopped', false);
              document.getElementById('stop-btn').disabled = true;
            }
          } catch (error) {
            console.error('Error stopping stream:', error);
          }
        }

        function updateStatus(text, isStreaming) {
          const statusDiv = document.getElementById('status');
          const statusText = document.getElementById('status-text');
          
          statusText.textContent = text;
          statusDiv.className = isStreaming ? 'status streaming' : 'status stopped';
        }

        // Event listeners
        document.getElementById('refresh-btn').addEventListener('click', loadSegments);
        document.getElementById('stop-btn').addEventListener('click', stopStream);

        // Load segments on page load
        loadSegments();
      </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Broadcast Node running on port ${PORT}`);
  console.log(`Segments directory: ${segmentsPath}`);
  console.log(`YouTube RTMP URL: ${youtubeRtmpUrl}`);
  console.log(`YouTube Stream Key: ${youtubeStreamKey ? 'configured' : 'NOT CONFIGURED'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping stream...');
  stopStreaming();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping stream...');
  stopStreaming();
  process.exit(0);
});
