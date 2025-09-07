const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:19000', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
const PORT = process.env.PORT || 8080;

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


app.listen(PORT, () => {
    console.log(`VistterStudio server listening on port ${PORT}`);
});
