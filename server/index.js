const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

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

// The URL for the Wyze Bridge container
const WYZE_BRIDGE_URL = 'http://wyze-bridge:5000';
const WYZE_BRIDGE_API_KEY = 'D-hNZigAPnrotiyn5_-zbzJyfMjLJpDlRrxKF-xQ';

app.get('/', (req, res) => {
    res.send('VistterStudio Server is running!');
});

/**
 * @api {get} /api/status Get Wyze Bridge Status
 * @apiName GetStatus
 * @apiGroup WyzeBridge
 *
 * @apiSuccess {Object} status The status object from the Wyze Bridge.
 * 
 * @apiError {String} message Error message.
 */
app.get('/api/status', async (req, res) => {
    try {
        const response = await axios.get(`${WYZE_BRIDGE_URL}/api?api=${WYZE_BRIDGE_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching status from Wyze Bridge:', error.message);
        res.status(500).json({ message: 'Failed to fetch status from Wyze Bridge' });
    }
});

/**
 * @api {get} /api/cams Get Wyze Cameras
 * @apiName GetCams
 * @apiGroup WyzeBridge
 * 
 * @apiSuccess {Object} cams The camera list from the Wyze Bridge.
 * 
 * @apiError {String} message Error message.
 */
app.get('/api/cams', async (req, res) => {
    try {
        const response = await axios.get(`${WYZE_BRIDGE_URL}/api?api=${WYZE_BRIDGE_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching cameras from Wyze Bridge:', error.message);
        res.status(500).json({ message: 'Failed to fetch cameras from Wyze Bridge' });
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
