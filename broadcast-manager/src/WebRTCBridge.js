const axios = require('axios');

class WebRTCBridge {
  constructor({ cameraName, wyzeBridgeUrl = 'http://wyze-bridge:5000', onStatusChange, onError }) {
    this.cameraName = cameraName;
    this.wyzeBridgeUrl = wyzeBridgeUrl;
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    
    this.isConnected = false;
    this.webrtcEndpoint = null;
    
    this.status = {
      status: 'offline',
      connected: false,
      error: null
    };
  }

  async start() {
    try {
      console.log(`🚀 Starting WebRTC bridge for v4 camera: ${this.cameraName}`);
      
      this.updateStatus({ status: 'connecting', connected: false, error: null });

      // Get the WebRTC endpoint from wyze-bridge
      this.webrtcEndpoint = `${this.wyzeBridgeUrl}/webrtc/${this.cameraName}`;
      
      // Verify the camera is available
      await this.verifyCameraAvailable();
      
      this.updateStatus({ status: 'connected', connected: true });
      this.isConnected = true;
      
      console.log(`✅ WebRTC bridge ready for ${this.cameraName}: ${this.webrtcEndpoint}`);
      return this.webrtcEndpoint;
      
    } catch (error) {
      console.error(`❌ Failed to start WebRTC bridge for ${this.cameraName}:`, error);
      this.updateStatus({ 
        status: 'error', 
        connected: false, 
        error: error.message 
      });
      
      if (this.onError) {
        this.onError(error);
      }
      
      throw error;
    }
  }

  async stop() {
    try {
      console.log(`🛑 Stopping WebRTC bridge for ${this.cameraName}`);
      
      this.updateStatus({ status: 'stopping', connected: false });
      
      this.isConnected = false;
      this.webrtcEndpoint = null;
      this.updateStatus({ status: 'offline', connected: false });
      
      console.log(`✅ WebRTC bridge stopped for ${this.cameraName}`);
      
    } catch (error) {
      console.error(`❌ Error stopping WebRTC bridge for ${this.cameraName}:`, error);
      throw error;
    }
  }

  async verifyCameraAvailable() {
    try {
      console.log(`🔍 Verifying v4 camera availability: ${this.cameraName}`);
      
      // Check if the camera is available via the wyze-bridge API
      const response = await axios.get(`${this.wyzeBridgeUrl}/api/${this.cameraName}`, {
        timeout: 10000
      });
      
      const cameraData = response.data;
      
      // Verify this is a v4 camera
      if (cameraData.product_model !== 'HL_CAM4') {
        throw new Error(`Camera ${this.cameraName} is not a v4 camera (${cameraData.product_model}). Only v4 cameras are supported.`);
      }
      
      // Check if WebRTC is available
      if (!cameraData.webrtc) {
        throw new Error(`Camera ${this.cameraName} does not support WebRTC`);
      }
      
      console.log(`✅ v4 camera verified: ${cameraData.nickname} (${cameraData.product_model})`);
      
      return cameraData;
      
    } catch (error) {
      if (error.response) {
        throw new Error(`Camera ${this.cameraName} not found or unavailable: ${error.response.status}`);
      }
      throw new Error(`Failed to verify camera ${this.cameraName}: ${error.message}`);
    }
  }

  getWebRTCUrl() {
    return this.webrtcEndpoint;
  }

  updateStatus(updates) {
    this.status = { ...this.status, ...updates };
    console.log(`📊 WebRTC Bridge status for ${this.cameraName}:`, this.status);
    
    if (this.onStatusChange) {
      this.onStatusChange(this.status);
    }
  }

  getStatus() {
    return {
      ...this.status,
      cameraName: this.cameraName,
      webrtcEndpoint: this.webrtcEndpoint,
      isConnected: this.isConnected
    };
  }
}

module.exports = WebRTCBridge;