const express = require('express');
const { TimelineEngine } = require('./timeline');
const { AssetManager } = require('./assets');
const { CameraManager } = require('./cameras');
const { ApiManager } = require('./apis');

const app = express();
const port = process.env.PORT || 8080;

// Initialize managers
const timelineEngine = new TimelineEngine();
const assetManager = new AssetManager();
const cameraManager = new CameraManager();
const apiManager = new ApiManager();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Timeline execution endpoints
app.post('/api/execute/start', async (req, res) => {
  try {
    const { segmentId } = req.body;
    await timelineEngine.executeSegment(segmentId);
    res.json({ success: true, segmentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/execute/stop', async (req, res) => {
  try {
    await timelineEngine.stopExecution();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Asset sync endpoints
app.post('/api/sync/assets', async (req, res) => {
  try {
    const { segmentId } = req.body;
    await assetManager.syncAssets(segmentId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API configuration endpoints
app.post('/api/config/weather', async (req, res) => {
  try {
    const config = req.body;
    await apiManager.configureWeather(config);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/config/ads', async (req, res) => {
  try {
    const config = req.body;
    await apiManager.configureAds(config);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status endpoints
app.get('/api/status', async (req, res) => {
  try {
    const status = {
      timeline: timelineEngine.getStatus(),
      assets: assetManager.getStatus(),
      cameras: cameraManager.getStatus(),
      apis: apiManager.getStatus()
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`VistterStudio Broadcast Node running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await timelineEngine.stopExecution();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await timelineEngine.stopExecution();
  process.exit(0);
});
