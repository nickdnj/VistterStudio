const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const url = require('url');

const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:19000', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));

// JSON middleware
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Asset storage setup
const ASSETS_DIR = path.join(__dirname, 'assets');
fs.ensureDirSync(ASSETS_DIR);
fs.ensureDirSync(path.join(ASSETS_DIR, 'images'));
fs.ensureDirSync(path.join(ASSETS_DIR, 'videos'));
fs.ensureDirSync(path.join(ASSETS_DIR, 'audio'));
fs.ensureDirSync(path.join(ASSETS_DIR, 'documents'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'documents';
        if (file.mimetype.startsWith('image/')) folder = 'images';
        else if (file.mimetype.startsWith('video/')) folder = 'videos';
        else if (file.mimetype.startsWith('audio/')) folder = 'audio';
        
        cb(null, path.join(ASSETS_DIR, folder));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        // Allow common media types
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|mkv|mp3|wav|flac|aac|pdf|txt|md/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
    }
});

// Serve static assets
app.use('/assets', express.static(ASSETS_DIR));

// RTMP Camera configuration storage
const RTMP_CAMERAS_FILE = path.join(__dirname, 'rtmp_cameras.json');

// Ensure RTMP cameras file exists
const ensureRtmpCamerasFile = async () => {
    if (!await fs.pathExists(RTMP_CAMERAS_FILE)) {
        await fs.writeJson(RTMP_CAMERAS_FILE, [], { spaces: 2 });
    }
};

app.get('/', (req, res) => {
    res.send('VistterStudio Server is running!');
});

/**
 * @api {get} /api/rtmp/cameras Get RTMP Cameras
 * @apiName GetRTMPCameras
 * @apiGroup RTMPCameras
 * 
 * @apiSuccess {Array} cameras List of configured RTMP cameras.
 * 
 * @apiError {String} message Error message.
 */
app.get('/api/rtmp/cameras', async (req, res) => {
    try {
        await ensureRtmpCamerasFile();
        const cameras = await fs.readJson(RTMP_CAMERAS_FILE);
        
        // Remove sensitive credentials from response
        const safeCameras = cameras.map(camera => ({
            id: camera.id,
            name: camera.name,
            host: camera.host,
            port: camera.port,
            channel: camera.channel,
            stream: camera.stream,
            protocols: camera.protocols || ['rtmp'],
            status: camera.status || 'unknown',
            isActive: camera.isActive || false,
            createdAt: camera.createdAt,
            updatedAt: camera.updatedAt
        }));
        
        res.json({ cameras: safeCameras });
    } catch (error) {
        console.error('Error fetching RTMP cameras:', error.message);
        res.status(500).json({ message: 'Failed to fetch RTMP cameras' });
    }
});

/**
 * @api {post} /api/rtmp/cameras Add RTMP Camera
 * @apiName AddRTMPCamera
 * @apiGroup RTMPCameras
 * 
 * @apiSuccess {Object} camera The added camera configuration.
 * 
 * @apiError {String} message Error message.
 */
app.post('/api/rtmp/cameras', async (req, res) => {
    try {
        await ensureRtmpCamerasFile();
        const { 
            name, 
            host, 
            port = 1935, 
            channel = 0, 
            stream = 2, 
            username, 
            password,
            protocols = ['rtmp'] // Default to RTMP, but allow multiple
        } = req.body;
        
        if (!name || !host || !username || !password) {
            return res.status(400).json({ 
                message: 'Name, host, username, and password are required' 
            });
        }
        
        const cameras = await fs.readJson(RTMP_CAMERAS_FILE);
        
        const newCamera = {
            id: uuidv4(),
            name,
            host,
            port: parseInt(port),
            channel: parseInt(channel),
            stream: parseInt(stream),
            username,
            password, // Store encrypted in production
            protocols: Array.isArray(protocols) ? protocols : ['rtmp'],
            status: 'configured',
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        cameras.push(newCamera);
        await fs.writeJson(RTMP_CAMERAS_FILE, cameras, { spaces: 2 });
        
        // Return camera without password
        const { password: _, ...safeCamera } = newCamera;
        res.json({ camera: safeCamera });
    } catch (error) {
        console.error('Error adding RTMP camera:', error.message);
        res.status(500).json({ message: 'Failed to add RTMP camera' });
    }
});

/**
 * @api {get} /api/rtmp/cameras/:id/stream Get RTMP Stream URL
 * @apiName GetRTMPStreamURL
 * @apiGroup RTMPCameras
 * 
 * @apiSuccess {Object} stream The stream URL and metadata.
 * 
 * @apiError {String} message Error message.
 */
app.get('/api/rtmp/cameras/:id/stream', async (req, res) => {
    try {
        await ensureRtmpCamerasFile();
        const cameras = await fs.readJson(RTMP_CAMERAS_FILE);
        const camera = cameras.find(cam => cam.id === req.params.id);
        
        if (!camera) {
            return res.status(404).json({ message: 'Camera not found' });
        }
        
        // Generate URLs for different protocols
        const streamUrls = {
            rtmp: `rtmp://${camera.host}:${camera.port}/bcs/channel${camera.channel}_ext.bcs?channel=${camera.channel}&stream=${camera.stream}&user=${camera.username}&password=${camera.password}`,
            http: `http://${camera.host}/cgi-bin/api.cgi?cmd=Snap&channel=${camera.channel}&rs=wuuPhkmUOx&user=${camera.username}&password=${camera.password}`,
            mjpeg: `http://${camera.host}/cgi-bin/api.cgi?cmd=GetMjpegStream&channel=${camera.channel}&subtype=${camera.stream}&user=${camera.username}&password=${camera.password}`,
            rtsp: `rtsp://${camera.username}:${camera.password}@${camera.host}:554/h264Preview_${camera.channel < 10 ? '0' + camera.channel : camera.channel}_sub`
        };
        
        res.json({
            streamUrls,
            cameraId: camera.id,
            cameraName: camera.name,
            protocols: camera.protocols || ['rtmp'],
            primaryUrl: streamUrls.rtmp
        });
    } catch (error) {
        console.error('Error getting RTMP stream URL:', error.message);
        res.status(500).json({ message: 'Failed to get RTMP stream URL' });
    }
});

/**
 * @api {get} /api/rtmp/cameras/:id/mjpeg-proxy MJPEG Proxy Stream
 * @apiName GetMJPEGProxy
 * @apiGroup RTMPCameras
 * 
 * @apiSuccess {Stream} video MJPEG video stream with CORS headers.
 * 
 * @apiError {String} message Error message.
 */
app.get('/api/rtmp/cameras/:id/mjpeg-proxy', async (req, res) => {
    try {
        await ensureRtmpCamerasFile();
        const cameras = await fs.readJson(RTMP_CAMERAS_FILE);
        const camera = cameras.find(cam => cam.id === req.params.id);
        
        if (!camera) {
            return res.status(404).json({ message: 'Camera not found' });
        }
        
        console.log(`Setting up MJPEG proxy for camera: ${camera.name} at ${camera.host}`);
        
        // Set CORS headers first
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Use axios for more reliable HTTP handling
        const mjpegUrl = `http://${camera.host}/cgi-bin/api.cgi?cmd=GetMjpegStream&channel=${camera.channel}&subtype=${camera.stream}&user=${camera.username}&password=${camera.password}`;
        
        console.log(`Requesting MJPEG stream from: ${mjpegUrl}`);
        
        try {
            const response = await axios({
                method: 'GET',
                url: mjpegUrl,
                responseType: 'stream',
                timeout: 10000,
                headers: {
                    'User-Agent': 'VistterStudio/1.0',
                    'Accept': '*/*',
                    'Connection': 'keep-alive'
                }
            });
            
            console.log(`Camera responded with status: ${response.status}, content-type: ${response.headers['content-type']}`);
            
            // Set appropriate content type
            res.setHeader('Content-Type', response.headers['content-type'] || 'multipart/x-mixed-replace; boundary=--myboundary');
            
            // Handle client disconnect
            req.on('close', () => {
                console.log('Client disconnected from MJPEG stream');
                if (response.data) {
                    response.data.destroy();
                }
            });
            
            // Pipe the stream
            response.data.pipe(res);
            
        } catch (streamError) {
            console.error('MJPEG stream error:', streamError.message);
            
            // Send error response if headers haven't been sent
            if (!res.headersSent) {
                res.status(500).json({ 
                    message: 'Camera stream unavailable',
                    error: streamError.message,
                    camera: camera.name,
                    host: camera.host
                });
            }
        }
        
    } catch (error) {
        console.error('Error setting up MJPEG proxy:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to setup MJPEG proxy' });
        }
    }
});

/**
 * @api {get} /api/rtmp/cameras/:id/snapshot Camera Snapshot
 * @apiName GetCameraSnapshot
 * @apiGroup RTMPCameras
 * 
 * @apiSuccess {Image} image JPEG snapshot with CORS headers.
 * 
 * @apiError {String} message Error message.
 */
app.get('/api/rtmp/cameras/:id/snapshot', async (req, res) => {
    try {
        await ensureRtmpCamerasFile();
        const cameras = await fs.readJson(RTMP_CAMERAS_FILE);
        const camera = cameras.find(cam => cam.id === req.params.id);
        
        if (!camera) {
            return res.status(404).json({ message: 'Camera not found' });
        }
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Use snapshot endpoint for more reliable single-frame access
        const snapshotUrl = `http://${camera.host}/cgi-bin/api.cgi?cmd=Snap&channel=${camera.channel}&rs=wuuPhkmUOx&user=${camera.username}&password=${camera.password}`;
        
        console.log(`Requesting snapshot from: ${snapshotUrl}`);
        
        try {
            const response = await axios({
                method: 'GET',
                url: snapshotUrl,
                responseType: 'stream',
                timeout: 5000,
                headers: {
                    'User-Agent': 'VistterStudio/1.0'
                }
            });
            
            // Set image content type
            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            
            // Pipe the image
            response.data.pipe(res);
            
        } catch (snapshotError) {
            console.error('Camera snapshot error:', snapshotError.message);
            
            if (!res.headersSent) {
                res.status(500).json({ 
                    message: 'Camera snapshot unavailable',
                    error: snapshotError.message,
                    camera: camera.name,
                    host: camera.host
                });
            }
        }
        
    } catch (error) {
        console.error('Error getting camera snapshot:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to get camera snapshot' });
        }
    }
});

/**
 * @api {delete} /api/rtmp/cameras/:id Delete RTMP Camera
 * @apiName DeleteRTMPCamera
 * @apiGroup RTMPCameras
 * 
 * @apiSuccess {String} message Success message.
 * 
 * @apiError {String} message Error message.
 */
app.delete('/api/rtmp/cameras/:id', async (req, res) => {
    try {
        await ensureRtmpCamerasFile();
        const cameras = await fs.readJson(RTMP_CAMERAS_FILE);
        const filteredCameras = cameras.filter(cam => cam.id !== req.params.id);
        
        if (cameras.length === filteredCameras.length) {
            return res.status(404).json({ message: 'Camera not found' });
        }
        
        await fs.writeJson(RTMP_CAMERAS_FILE, filteredCameras, { spaces: 2 });
        res.json({ message: 'Camera deleted successfully' });
    } catch (error) {
        console.error('Error deleting RTMP camera:', error.message);
        res.status(500).json({ message: 'Failed to delete RTMP camera' });
    }
});


/**
 * @api {post} /api/assets/upload Upload Asset
 * @apiName UploadAsset
 * @apiGroup Assets
 * 
 * @apiSuccess {Object} asset The uploaded asset information.
 * 
 * @apiError {String} message Error message.
 */
app.post('/api/assets/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const asset = {
            id: uuidv4(),
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            category: req.file.mimetype.startsWith('image/') ? 'images' :
                     req.file.mimetype.startsWith('video/') ? 'videos' :
                     req.file.mimetype.startsWith('audio/') ? 'audio' : 'documents',
            url: `/assets/${req.file.mimetype.startsWith('image/') ? 'images' :
                            req.file.mimetype.startsWith('video/') ? 'videos' :
                            req.file.mimetype.startsWith('audio/') ? 'audio' : 'documents'}/${req.file.filename}`,
            uploadedAt: new Date().toISOString(),
            tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : []
        };

        // Save asset metadata (in a real app, you'd use a database)
        const assetsMetaFile = path.join(ASSETS_DIR, 'assets.json');
        let assetsData = [];
        
        if (await fs.pathExists(assetsMetaFile)) {
            assetsData = await fs.readJson(assetsMetaFile);
        }
        
        assetsData.push(asset);
        await fs.writeJson(assetsMetaFile, assetsData, { spaces: 2 });

        res.json({ 
            message: 'Asset uploaded successfully',
            asset 
        });
    } catch (error) {
        console.error('Error uploading asset:', error.message);
        res.status(500).json({ message: 'Failed to upload asset' });
    }
});

/**
 * @api {get} /api/assets Get All Assets
 * @apiName GetAssets
 * @apiGroup Assets
 * 
 * @apiSuccess {Array} assets List of all assets.
 * 
 * @apiError {String} message Error message.
 */
app.get('/api/assets', async (req, res) => {
    try {
        const assetsMetaFile = path.join(ASSETS_DIR, 'assets.json');
        let assetsData = [];
        
        if (await fs.pathExists(assetsMetaFile)) {
            assetsData = await fs.readJson(assetsMetaFile);
        }

        // Filter by category if specified
        const category = req.query.category;
        if (category) {
            assetsData = assetsData.filter(asset => asset.category === category);
        }

        res.json({
            assets: assetsData,
            total: assetsData.length,
            categories: {
                images: assetsData.filter(a => a.category === 'images').length,
                videos: assetsData.filter(a => a.category === 'videos').length,
                audio: assetsData.filter(a => a.category === 'audio').length,
                documents: assetsData.filter(a => a.category === 'documents').length
            }
        });
    } catch (error) {
        console.error('Error fetching assets:', error.message);
        res.status(500).json({ message: 'Failed to fetch assets' });
    }
});

/**
 * @api {delete} /api/assets/:id Delete Asset
 * @apiName DeleteAsset
 * @apiGroup Assets
 * 
 * @apiSuccess {String} message Success message.
 * 
 * @apiError {String} message Error message.
 */
app.delete('/api/assets/:id', async (req, res) => {
    try {
        const assetId = req.params.id;
        const assetsMetaFile = path.join(ASSETS_DIR, 'assets.json');
        
        if (!await fs.pathExists(assetsMetaFile)) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        let assetsData = await fs.readJson(assetsMetaFile);
        const assetIndex = assetsData.findIndex(asset => asset.id === assetId);
        
        if (assetIndex === -1) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const asset = assetsData[assetIndex];
        const filePath = path.join(ASSETS_DIR, asset.category, asset.filename);
        
        // Delete the file
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }

        // Remove from metadata
        assetsData.splice(assetIndex, 1);
        await fs.writeJson(assetsMetaFile, assetsData, { spaces: 2 });

        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error.message);
        res.status(500).json({ message: 'Failed to delete asset' });
    }
});

app.listen(PORT, () => {
    console.log(`VistterStudio server listening on port ${PORT}`);
});
