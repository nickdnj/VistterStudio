import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const LiveStreamStatus = ({ className = "" }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState({
    isLive: false,
    isRecording: false,
    platform: null,
    viewers: 0,
    uptime: 0,
    bitrate: 0
  });
  const [streamHealth, setStreamHealth] = useState({
    currentBitrate: 0,
    averageFps: 0,
    droppedFrames: 0,
    bufferHealth: 100
  });

  // Platform configurations
  const platformConfig = {
    youtube: { name: 'YouTube Live', icon: '📺', color: 'bg-red-600' },
    twitch: { name: 'Twitch', icon: '🎮', color: 'bg-purple-600' },
    facebook: { name: 'Facebook Live', icon: '📘', color: 'bg-blue-600' },
    custom: { name: 'Custom RTMP', icon: '🔧', color: 'bg-gray-600' }
  };

  // Initialize socket connection
  useEffect(() => {
    const broadcastSocket = io('http://localhost:3001');
    setSocket(broadcastSocket);
    
    broadcastSocket.on('connect', () => {
      setIsConnected(true);
    });
    
    broadcastSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    
    broadcastSocket.on('broadcast:status', (status) => {
      setBroadcastStatus(status);
    });
    
    broadcastSocket.on('stream:health', (health) => {
      setStreamHealth(health);
    });
    
    return () => {
      broadcastSocket.disconnect();
    };
  }, []);

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

  if (!broadcastStatus.isLive) {
    return null; // Don't show anything when not live
  }

  const platform = platformConfig[broadcastStatus.platform] || platformConfig.custom;

  return (
    <div className={`${className}`}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        {/* Live Status Header */}
        <div className={`${platform.color} px-4 py-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-sm">
                {platform.icon} LIVE on {platform.name}
              </span>
            </div>
            <div className="text-white text-xs">
              {formatTime(broadcastStatus.uptime)}
            </div>
          </div>
        </div>

        {/* Stream Metrics */}
        <div className="p-3 bg-gray-800">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Viewers:</span>
              <span className="text-white font-medium">
                {broadcastStatus.viewers.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bitrate:</span>
              <span className="text-white font-medium">
                {streamHealth.currentBitrate || broadcastStatus.bitrate}k
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">FPS:</span>
              <span className="text-white font-medium">
                {streamHealth.averageFps}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Health:</span>
              <span className={`font-medium ${
                streamHealth.bufferHealth > 80 ? 'text-green-400' :
                streamHealth.bufferHealth > 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {streamHealth.bufferHealth}%
              </span>
            </div>
          </div>

          {/* Recording Status */}
          {broadcastStatus.isRecording && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-xs font-medium">Recording</span>
              </div>
            </div>
          )}

          {/* Health Warnings */}
          {streamHealth.droppedFrames > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-yellow-400 text-xs">
                ⚠️ {streamHealth.droppedFrames} dropped frames
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamStatus;
