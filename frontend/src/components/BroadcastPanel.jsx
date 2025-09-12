import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BroadcastPanel = ({ className = "" }) => {
  // Connection state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Broadcast state
  const [broadcastStatus, setBroadcastStatus] = useState({
    isLive: false,
    isRecording: false,
    isPlaying: false,
    isLooping: false,
    currentTimeMs: 0,
    timelineDuration: 0,
    uptime: 0,
    viewers: 0,
    bitrate: 0
  });
  
  // Stream health
  const [streamHealth, setStreamHealth] = useState({
    connectionStatus: 'disconnected',
    droppedFrames: 0,
    averageFps: 0,
    bufferHealth: 0
  });
  
  // Configuration
  const [streamConfig, setStreamConfig] = useState({
    platform: 'youtube',
    streamKey: '',
    resolution: '1920x1080',
    framerate: 30,
    bitrate: 3500
  });
  
  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Available platforms
  const platforms = [
    { id: 'youtube', name: 'YouTube Live', color: 'bg-red-600' },
    { id: 'twitch', name: 'Twitch', color: 'bg-purple-600' },
    { id: 'facebook', name: 'Facebook Live', color: 'bg-blue-600' },
    { id: 'custom', name: 'Custom RTMP', color: 'bg-gray-600' }
  ];
  
  // Initialize socket connection
  useEffect(() => {
    const broadcastSocket = io('http://localhost:3001');
    setSocket(broadcastSocket);
    
    // Connection events
    broadcastSocket.on('connect', () => {
      console.log('📡 Connected to broadcast server');
      setIsConnected(true);
    });
    
    broadcastSocket.on('disconnect', () => {
      console.log('📡 Disconnected from broadcast server');
      setIsConnected(false);
    });
    
    // Broadcast events
    broadcastSocket.on('broadcast:status', (status) => {
      setBroadcastStatus(status);
    });
    
    broadcastSocket.on('broadcast:started', (status) => {
      setBroadcastStatus(status);
      setIsStarting(false);
    });
    
    broadcastSocket.on('broadcast:stopped', (status) => {
      setBroadcastStatus(status);
      setIsStarting(false);
    });
    
    broadcastSocket.on('broadcast:error', (error) => {
      console.error('Broadcast error:', error);
      setIsStarting(false);
      alert(`Broadcast error: ${error.message}`);
    });
    
    // Stream health events
    broadcastSocket.on('stream:health', (health) => {
      setStreamHealth(health);
    });
    
    return () => {
      broadcastSocket.disconnect();
    };
  }, []);
  
  // Start broadcast
  const handleStartBroadcast = async () => {
    if (!streamConfig.streamKey.trim()) {
      alert('Please enter your stream key');
      return;
    }
    
    setIsStarting(true);
    
    if (socket) {
      socket.emit('broadcast:start', streamConfig);
    }
  };
  
  // Stop broadcast
  const handleStopBroadcast = () => {
    if (socket) {
      socket.emit('broadcast:stop');
    }
  };
  
  // Start/stop recording
  const handleToggleRecording = () => {
    if (socket) {
      if (broadcastStatus.isRecording) {
        socket.emit('recording:stop');
      } else {
        socket.emit('recording:start');
      }
    }
  };
  
  // Playback controls
  const handlePlay = () => {
    if (socket) {
      socket.emit('playback:play');
    }
  };
  
  const handlePause = () => {
    if (socket) {
      socket.emit('playback:pause');
    }
  };
  
  // Format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  // Format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  const selectedPlatform = platforms.find(p => p.id === streamConfig.platform);
  
  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center">
            📡 Broadcast Control
            <span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </h2>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <h3 className="text-white font-medium mb-3">Stream Configuration</h3>
          
          {/* Platform Selection */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Platform</label>
            <select
              value={streamConfig.platform}
              onChange={(e) => setStreamConfig({ ...streamConfig, platform: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              disabled={broadcastStatus.isLive}
            >
              {platforms.map(platform => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Stream Key */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Stream Key</label>
            <input
              type="password"
              value={streamConfig.streamKey}
              onChange={(e) => setStreamConfig({ ...streamConfig, streamKey: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              placeholder="Enter your stream key..."
              disabled={broadcastStatus.isLive}
            />
          </div>
          
          {/* Resolution & Quality */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Resolution</label>
              <select
                value={streamConfig.resolution}
                onChange={(e) => setStreamConfig({ ...streamConfig, resolution: e.target.value })}
                className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                disabled={broadcastStatus.isLive}
              >
                <option value="1920x1080">1080p</option>
                <option value="1280x720">720p</option>
                <option value="854x480">480p</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">FPS</label>
              <select
                value={streamConfig.framerate}
                onChange={(e) => setStreamConfig({ ...streamConfig, framerate: parseInt(e.target.value) })}
                className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                disabled={broadcastStatus.isLive}
              >
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bitrate</label>
              <input
                type="number"
                value={streamConfig.bitrate}
                onChange={(e) => setStreamConfig({ ...streamConfig, bitrate: parseInt(e.target.value) })}
                className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                min="1000"
                max="8000"
                disabled={broadcastStatus.isLive}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Main Controls */}
      <div className="p-4">
        {/* Status Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {broadcastStatus.isLive ? (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 font-semibold">LIVE</span>
                  <span className={`px-2 py-1 rounded text-xs text-white ${selectedPlatform?.color}`}>
                    {selectedPlatform?.name}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-400">OFFLINE</span>
                </>
              )}
            </div>
            
            <div className="text-right">
              {broadcastStatus.isLive && (
                <div className="text-sm text-gray-300">
                  <div>Uptime: {formatTime(broadcastStatus.uptime)}</div>
                  <div>Viewers: {broadcastStatus.viewers.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Stream Health */}
          {broadcastStatus.isLive && (
            <div className="bg-gray-800 rounded p-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Bitrate: {streamHealth.currentBitrate || broadcastStatus.bitrate}k</div>
                <div>FPS: {streamHealth.averageFps}</div>
                <div>Dropped: {streamHealth.droppedFrames}</div>
                <div>Buffer: {streamHealth.bufferHealth}%</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Broadcast Controls */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {!broadcastStatus.isLive ? (
            <button
              onClick={handleStartBroadcast}
              disabled={isStarting || !isConnected}
              className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Starting...
                </>
              ) : (
                <>🔴 Go Live</>
              )}
            </button>
          ) : (
            <button
              onClick={handleStopBroadcast}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              ⏹️ Stop
            </button>
          )}
          
          <button
            onClick={handleToggleRecording}
            disabled={!isConnected}
            className={`flex items-center justify-center px-4 py-2 rounded transition-colors ${
              broadcastStatus.isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {broadcastStatus.isRecording ? '⏹️ Stop Rec' : '🎥 Record'}
          </button>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <button
            onClick={handlePlay}
            disabled={!isConnected || broadcastStatus.isPlaying}
            className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            ▶️
          </button>
          <button
            onClick={handlePause}
            disabled={!isConnected || !broadcastStatus.isPlaying}
            className="p-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            ⏸️
          </button>
          
          <div className="text-xs text-gray-400 ml-4">
            {formatTime(broadcastStatus.currentTimeMs)} / {formatTime(broadcastStatus.timelineDuration)}
          </div>
        </div>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-red-900 border border-red-700 rounded p-2 text-center">
            <div className="text-red-400 text-sm">
              ⚠️ Broadcast server disconnected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BroadcastPanel;
