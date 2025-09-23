const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  SEGMENT_ID_PATTERN,
  SegmentValidationError,
  normalizeSegmentId,
  resolveSegmentPath,
} = require('@vistterstudio/shared/utils/segments');

const app = express();
const PORT = process.env.PORT || 4000;

const resolveSegmentsDir = () => {
  const configured = process.env.SEGMENTS_PATH || path.join(__dirname, '../../data/segments');
  const resolved = path.resolve(configured);
  fs.ensureDirSync(resolved);
  return resolved;
};

const segmentsDir = resolveSegmentsDir();

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof SegmentValidationError) {
    return res.status(400).json({ error: 'Invalid segment id' });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API Routes

// Get all segments
app.get('/api/segments', async (req, res) => {
  try {
    const files = await fs.readdir(segmentsDir);
    const segments = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const segmentId = path.basename(file, '.json');

        if (!SEGMENT_ID_PATTERN.test(segmentId)) {
          continue;
        }

        const segmentPath = path.resolve(segmentsDir, file);
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
    handleError(res, error, 'Failed to read segments');
  }
});

// Get specific segment
app.get('/api/segments/:id', async (req, res) => {
  try {
    const { filePath } = resolveSegmentPath(segmentsDir, req.params.id);

    if (await fs.pathExists(filePath)) {
      const segmentData = await fs.readJson(filePath);
      res.json(segmentData);
    } else {
      res.status(404).json({ error: 'Segment not found' });
    }
  } catch (error) {
    handleError(res, error, 'Failed to read segment');
  }
});

// Save segment
app.post('/api/segments', async (req, res) => {
  try {
    const segmentData = req.body || {};
    const requestedId = segmentData.id ? normalizeSegmentId(segmentData.id) : uuidv4();
    const { id: segmentId, filePath } = resolveSegmentPath(segmentsDir, requestedId);

    const nowIso = new Date().toISOString();

    const segment = {
      id: segmentId,
      name: segmentData.name || `Segment ${segmentId}`,
      duration: segmentData.duration || 0,
      created: nowIso,
      updated: nowIso,
      tracks: segmentData.tracks || [],
      assets: segmentData.assets || [],
      apiConfigs: segmentData.apiConfigs || []
    };

    await fs.writeJson(filePath, segment, { spaces: 2 });

    console.log(`Segment saved: ${segmentId}`);
    res.json({ success: true, id: segmentId, segment });
  } catch (error) {
    handleError(res, error, 'Failed to save segment');
  }
});

// Update segment
app.put('/api/segments/:id', async (req, res) => {
  try {
    const { id: segmentId, filePath } = resolveSegmentPath(segmentsDir, req.params.id);
    const segmentData = req.body || {};

    const segment = {
      ...segmentData,
      id: segmentId,
      updated: new Date().toISOString()
    };

    await fs.writeJson(filePath, segment, { spaces: 2 });

    console.log(`Segment updated: ${segmentId}`);
    res.json({ success: true, segment });
  } catch (error) {
    handleError(res, error, 'Failed to update segment');
  }
});

// Delete segment
app.delete('/api/segments/:id', async (req, res) => {
  try {
    const { id: segmentId, filePath } = resolveSegmentPath(segmentsDir, req.params.id);

    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(`Segment deleted: ${segmentId}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Segment not found' });
    }
  } catch (error) {
    handleError(res, error, 'Failed to delete segment');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'cloud-editor-backend',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Editor Backend running on port ${PORT}`);
    console.log(`Segments directory: ${segmentsDir}`);
  });
}

module.exports = {
  app,
  segmentsDir,
  normalizeSegmentId,
  resolveSegmentPath,
  SegmentValidationError,
};
