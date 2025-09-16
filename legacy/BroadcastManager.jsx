import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BroadcastManager = ({ className = "" }) => {
  // Socket connection
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Broadcast state
  const [broadcastStatus, setBroadcastStatus] = useState({
    isLive: false,
    isRecording: false,
    isPlaying: false,
    uptime: 0,
    viewers: 0,
    bitrate: 0,
    platform: null
  });
  
  // Platform credentials
  const [credentials, setCredentials] = useState({
    youtube: {
      streamKey: '',
      enabled: false,
      lastUsed: null
    },
    twitch: {
      streamKey: '',
      enabled: false,
      lastUsed: null
    },
    facebook: {
      streamKey: '',
      enabled: false,
      lastUsed: null
    },
    custom: {
      rtmpUrl: '',
      streamKey: '',
      enabled: false,
      lastUsed: null
    }
  });
  
  // Stream settings
  const [streamSettings, setStreamSettings] = useState({
    resolution: '1920x1080',
    framerate: 30,
    bitrate: 3500,
    keyframeInterval: 2,
    preset: 'veryfast'
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('platforms');
  const [showCredentials, setShowCredentials] = useState({});
  const [isStarting, setIsStarting] = useState(false);
  
  // Platform configurations
  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube Live',
      icon: '📺',
      color: 'bg-red-600',
      description: 'Stream to YouTube Live',
      maxBitrate: 8000,
      supportedResolutions: ['1920x1080', '1280x720', '854x480'],
      streamKeyHelp: 'Get your stream key from YouTube Studio → Go Live → Stream'
    },
    {
      id: 'twitch',
      name: 'Twitch',
      icon: '🎮',
      color: 'bg-purple-600',
      description: 'Stream to Twitch',
      maxBitrate: 6000,
      supportedResolutions: ['1920x1080', '1280x720'],
      streamKeyHelp: 'Get your stream key from Twitch Creator Dashboard → Settings → Stream'
    },
    {
      id: 'facebook',
      name: 'Facebook Live',
      icon: '📘',
      color: 'bg-blue-600',
      description: 'Stream to Facebook Live',
      maxBitrate: 4000,
      supportedResolutions: ['1920x1080', '1280x720'],
      streamKeyHelp: 'Get your stream key from Facebook Creator Studio → Live → Go Live'
    },
    {
      id: 'custom',
      name: 'Custom RTMP',
      icon: '🔧',
      color: 'bg-gray-600',
      description: 'Stream to custom RTMP server',
      maxBitrate: 10000,
      supportedResolutions: ['1920x1080', '1280x720', '854x480'],
      streamKeyHelp: 'Enter your custom RTMP server URL and stream key'
    }
  ];
  
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
    
    return () => {
      broadcastSocket.disconnect();
    };
  }, []);
  
  // Load saved credentials
  useEffect(() => {
    const saved = localStorage.getItem('vistter-broadcast-credentials');
    if (saved) {
      try {
        setCredentials(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load credentials:', error);
      }
    }
    
    const savedSettings = localStorage.getItem('vistter-stream-settings');
    if (savedSettings) {
      try {
        setStreamSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load stream settings:', error);
      }
    }
  }, []);
  
  // Save credentials
  const saveCredentials = (newCredentials) => {
    setCredentials(newCredentials);
    localStorage.setItem('vistter-broadcast-credentials', JSON.stringify(newCredentials));
  };
  
  // Save stream settings
  const saveStreamSettings = (newSettings) => {
    setStreamSettings(newSettings);
    localStorage.setItem('vistter-stream-settings', JSON.stringify(newSettings));
  };
  
  // Update platform credentials
  const updatePlatformCredentials = (platformId, updates) => {
    const newCredentials = {
      ...credentials,
      [platformId]: {
        ...credentials[platformId],
        ...updates,
        lastUsed: new Date().toISOString()
      }
    };
    saveCredentials(newCredentials);
  };
  
  // Toggle platform enabled state
  const togglePlatform = (platformId) => {
    updatePlatformCredentials(platformId, {
      enabled: !credentials[platformId].enabled
    });
  };
  
  // Test stream key
  const testStreamKey = async (platformId) => {
    const platform = platforms.find(p => p.id === platformId);
    const creds = credentials[platformId];
    
    if (!creds.streamKey) {
      alert('Please enter a stream key first');
      return;
    }
    
    // For now, just validate format
    if (platformId === 'youtube' && !creds.streamKey.includes('-')) {
      alert('YouTube stream keys typically contain dashes. Please verify your key.');
      return;
    }
    
    alert(`Stream key format looks valid for ${platform.name}`);
  };
  
  // Start broadcast to specific platform
  const startBroadcast = (platformId) => {
    const platform = platforms.find(p => p.id === platformId);
    const creds = credentials[platformId];
    
    if (!creds.streamKey || (platformId === 'custom' && !creds.rtmpUrl)) {
      alert(`Please configure ${platform.name} credentials first`);
      return;
    }
    
    setIsStarting(true);
    
    const config = {
      platform: platformId,
      streamKey: creds.streamKey,
      rtmpUrl: platformId === 'custom' ? creds.rtmpUrl : undefined,
      ...streamSettings
    };
    
    if (socket) {
      socket.emit('broadcast:start', config);
    }
  };
  
  // Stop broadcast
  const stopBroadcast = () => {
    if (socket) {
      socket.emit('broadcast:stop');
    }
  };
  
  // Get enabled platforms
  const enabledPlatforms = platforms.filter(p => credentials[p.id].enabled);
  
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
  
  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center">
            📡 Broadcast Manager
            <span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </h2>
          
          {/* Live Status */}
          {broadcastStatus.isLive && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm font-semibold">LIVE</span>
              </div>
              <div className="text-xs text-gray-300">
                {formatTime(broadcastStatus.uptime)} • {broadcastStatus.viewers} viewers
              </div>
            </div>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex mt-3 space-x-1">
          {['platforms', 'settings', 'status'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <div className="space-y-4">
            {platforms.map((platform) => {
              const creds = credentials[platform.id];
              const isConfigured = platform.id === 'custom' 
                ? creds.rtmpUrl && creds.streamKey 
                : creds.streamKey;
              
              return (
                <div key={platform.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                        {platform.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{platform.name}</h3>
                        <p className="text-xs text-gray-400">{platform.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isConfigured && (
                        <span className="text-xs text-green-400">✓ Configured</span>
                      )}
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={creds.enabled}
                          onChange={() => togglePlatform(platform.id)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full transition-colors ${
                          creds.enabled ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                            creds.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Configuration */}
                  {creds.enabled && (
                    <div className="space-y-3">
                      {/* Custom RTMP URL */}
                      {platform.id === 'custom' && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">RTMP URL</label>
                          <input
                            type="text"
                            value={creds.rtmpUrl || ''}
                            onChange={(e) => updatePlatformCredentials(platform.id, { rtmpUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                            placeholder="rtmp://your-server.com/live/"
                            disabled={broadcastStatus.isLive}
                          />
                        </div>
                      )}
                      
                      {/* Stream Key */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Stream Key</label>
                        <div className="flex space-x-2">
                          <input
                            type={showCredentials[platform.id] ? "text" : "password"}
                            value={creds.streamKey || ''}
                            onChange={(e) => updatePlatformCredentials(platform.id, { streamKey: e.target.value })}
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                            placeholder="Enter your stream key..."
                            disabled={broadcastStatus.isLive}
                          />
                          <button
                            onClick={() => setShowCredentials({
                              ...showCredentials,
                              [platform.id]: !showCredentials[platform.id]
                            })}
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                          >
                            {showCredentials[platform.id] ? '🙈' : '👁️'}
                          </button>
                          <button
                            onClick={() => testStreamKey(platform.id)}
                            disabled={!creds.streamKey || broadcastStatus.isLive}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
                          >
                            Test
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{platform.streamKeyHelp}</p>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex space-x-2">
                        {!broadcastStatus.isLive ? (
                          <button
                            onClick={() => startBroadcast(platform.id)}
                            disabled={!isConfigured || isStarting || !isConnected}
                            className={`flex items-center justify-center px-4 py-2 rounded text-sm transition-colors ${
                              isConfigured
                                ? `${platform.color} hover:opacity-80 text-white`
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
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
                            onClick={stopBroadcast}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          >
                            ⏹️ Stop Stream
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="text-white font-medium">Stream Quality Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                <select
                  value={streamSettings.resolution}
                  onChange={(e) => saveStreamSettings({ ...streamSettings, resolution: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  disabled={broadcastStatus.isLive}
                >
                  <option value="1920x1080">1080p (1920x1080)</option>
                  <option value="1280x720">720p (1280x720)</option>
                  <option value="854x480">480p (854x480)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Frame Rate</label>
                <select
                  value={streamSettings.framerate}
                  onChange={(e) => saveStreamSettings({ ...streamSettings, framerate: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  disabled={broadcastStatus.isLive}
                >
                  <option value={30}>30 FPS</option>
                  <option value={60}>60 FPS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bitrate (kbps)</label>
                <input
                  type="number"
                  value={streamSettings.bitrate}
                  onChange={(e) => saveStreamSettings({ ...streamSettings, bitrate: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  min="1000"
                  max="10000"
                  step="500"
                  disabled={broadcastStatus.isLive}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Encoding Preset</label>
                <select
                  value={streamSettings.preset}
                  onChange={(e) => saveStreamSettings({ ...streamSettings, preset: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  disabled={broadcastStatus.isLive}
                >
                  <option value="ultrafast">Ultra Fast (lowest quality)</option>
                  <option value="superfast">Super Fast</option>
                  <option value="veryfast">Very Fast (recommended)</option>
                  <option value="faster">Faster</option>
                  <option value="fast">Fast</option>
                  <option value="medium">Medium (best quality)</option>
                </select>
              </div>
            </div>
            
            <div className="bg-blue-900 border border-blue-700 rounded p-3">
              <h4 className="text-blue-300 text-sm font-medium mb-2">💡 Quality Recommendations</h4>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• <strong>YouTube Live:</strong> 1080p30 @ 3500-5000 kbps</li>
                <li>• <strong>Twitch:</strong> 1080p30 @ 3000-4500 kbps</li>
                <li>• <strong>Facebook Live:</strong> 720p30 @ 2500-3500 kbps</li>
                <li>• <strong>Recording:</strong> Use "Medium" preset for best quality</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {broadcastStatus.isLive ? (
              <div className="space-y-4">
                <div className="bg-red-900 border border-red-700 rounded p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 font-semibold">LIVE BROADCAST</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Platform:</span>
                      <span className="text-white ml-2">{broadcastStatus.platform || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-white ml-2">{formatTime(broadcastStatus.uptime)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Viewers:</span>
                      <span className="text-white ml-2">{broadcastStatus.viewers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Bitrate:</span>
                      <span className="text-white ml-2">{broadcastStatus.bitrate}k</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded p-4">
                  <h4 className="text-white font-medium mb-2">Stream Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Connection</span>
                      <span className="text-green-400">Stable</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Buffer Health</span>
                      <span className="text-green-400">100%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Dropped Frames</span>
                      <span className="text-green-400">0</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📡</div>
                <h3 className="text-white font-medium mb-2">Ready to Broadcast</h3>
                <p className="text-gray-400 text-sm">Configure your platforms and click "Go Live" to start streaming</p>
                
                {enabledPlatforms.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Enabled platforms:</p>
                    <div className="flex justify-center space-x-2">
                      {enabledPlatforms.map((platform) => (
                        <div key={platform.id} className={`px-2 py-1 ${platform.color} rounded text-xs text-white`}>
                          {platform.icon} {platform.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-4 bg-red-900 border border-red-700 rounded p-3 text-center">
            <div className="text-red-400 text-sm">
              ⚠️ Broadcast server disconnected
            </div>
            <div className="text-xs text-red-300 mt-1">
              Make sure the broadcast server is running on port 3001
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BroadcastManager;
