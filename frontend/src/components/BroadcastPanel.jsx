import { useState, useEffect } from 'react';
import { Radio, Play, Square, AlertCircle, CheckCircle, Clock, Wifi } from 'lucide-react';
import { useTimelineStore } from '../timeline';
import axios from 'axios';

const BroadcastPanel = ({ className = '' }) => {
  const { tracks, clips, isLooping } = useTimelineStore();
  
  // Broadcast state
  const [broadcastStatus, setBroadcastStatus] = useState({
    status: 'offline',
    isStreaming: false,
    uptime: 0,
    error: null,
    bitrate: 0,
    fps: 0
  });
  
  // Form state with localStorage persistence
  const [streamConfig, setStreamConfig] = useState(() => {
    const saved = localStorage.getItem('vistterstudio-stream-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved stream config');
      }
    }
    return {
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      streamKey: '',
      title: 'VistterStudio Live Stream',
      description: 'Live stream from VistterStudio'
    };
  });

  // Save stream config to localStorage whenever it changes
  const updateStreamConfig = (updates) => {
    const newConfig = { ...streamConfig, ...updates };
    setStreamConfig(newConfig);
    localStorage.setItem('vistterstudio-stream-config', JSON.stringify(newConfig));
  };
  
  const [isConnecting, setIsConnecting] = useState(false);

  // Poll broadcast status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await axios.get('http://localhost:19001/api/broadcast/status');
        setBroadcastStatus(response.data);
      } catch (error) {
        console.warn('Could not fetch broadcast status:', error.message);
        setBroadcastStatus(prev => ({
          ...prev,
          status: 'offline',
          isStreaming: false,
          error: 'Broadcast service unavailable'
        }));
      }
    };

    // Poll every 2 seconds when streaming, every 10 seconds when offline
    const interval = broadcastStatus.isStreaming ? 2000 : 10000;
    const pollInterval = setInterval(pollStatus, interval);
    
    // Initial poll
    pollStatus();
    
    return () => clearInterval(pollInterval);
  }, [broadcastStatus.isStreaming]);

  const handleStartBroadcast = async () => {
    if (!streamConfig.streamKey.trim()) {
      alert('Please enter your YouTube Stream Key');
      return;
    }

    if (clips.length === 0) {
      alert('Please add content to your timeline before broadcasting');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Prepare timeline data for the broadcast service
      const timelineData = {
        tracks: tracks.filter(track => track.isVisible),
        clips: clips.filter(clip => clip.enabled !== false),
        isLooping,
        metadata: {
          title: streamConfig.title,
          description: streamConfig.description
        }
      };

      const response = await axios.post('http://localhost:19001/api/broadcast/start', {
        timelineData,
        streamConfig
      });

      console.log('Broadcast started:', response.data);
      
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      alert(`Failed to start broadcast: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStopBroadcast = async () => {
    setIsConnecting(true);
    
    try {
      await axios.post('http://localhost:19001/api/broadcast/stop');
      console.log('Broadcast stopped');
    } catch (error) {
      console.error('Failed to stop broadcast:', error);
      alert(`Failed to stop broadcast: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const getStatusIcon = () => {
    switch (broadcastStatus.status) {
      case 'live':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'stopping':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Radio className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (broadcastStatus.status) {
      case 'live': return 'text-green-500';
      case 'connecting': 
      case 'stopping': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <Radio className="h-5 w-5 text-red-500" />
        <h3 className="font-medium text-white">Live Broadcast</h3>
      </div>

      {/* Status Section */}
      <div className="mb-6 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium capitalize ${getStatusColor()}`}>
              {broadcastStatus.status}
            </span>
          </div>
          {broadcastStatus.isStreaming && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-500 font-medium">LIVE</span>
            </div>
          )}
        </div>
        
        {broadcastStatus.isStreaming && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Uptime:</span>
              <span className="text-white ml-1">{formatUptime(broadcastStatus.uptime)}</span>
            </div>
            <div>
              <span className="text-gray-400">FPS:</span>
              <span className="text-white ml-1">{Math.round(broadcastStatus.fps)}</span>
            </div>
            <div>
              <span className="text-gray-400">Bitrate:</span>
              <span className="text-white ml-1">{Math.round(broadcastStatus.bitrate)}k</span>
            </div>
            <div>
              <span className="text-gray-400">Loop:</span>
              <span className="text-white ml-1">{isLooping ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        )}

        {broadcastStatus.error && (
          <div className="mt-2 p-2 bg-red-900 bg-opacity-50 rounded border border-red-700">
            <p className="text-red-300 text-xs">{broadcastStatus.error}</p>
          </div>
        )}
      </div>

      {/* YouTube Live Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">YouTube Live Setup</h4>
        
        {/* Stream Title */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Stream Title</label>
          <input
            type="text"
            value={streamConfig.title}
            onChange={(e) => updateStreamConfig({ title: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            placeholder="Your live stream title"
          />
        </div>

        {/* RTMP URL */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">RTMP URL</label>
          <input
            type="text"
            value={streamConfig.rtmpUrl}
            onChange={(e) => updateStreamConfig({ rtmpUrl: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono"
            placeholder="rtmp://a.rtmp.youtube.com/live2"
          />
        </div>

        {/* Stream Key */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Stream Key</label>
          <input
            type="password"
            value={streamConfig.streamKey}
            onChange={(e) => updateStreamConfig({ streamKey: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono"
            placeholder="Your YouTube stream key"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from YouTube Studio → Go Live → Stream
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description (Optional)</label>
          <textarea
            value={streamConfig.description}
            onChange={(e) => updateStreamConfig({ description: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows="2"
            placeholder="Stream description..."
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 space-y-3">
        {!broadcastStatus.isStreaming ? (
          <button
            onClick={handleStartBroadcast}
            disabled={isConnecting || !streamConfig.streamKey.trim()}
            className={`
              w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-colors
              ${isConnecting || !streamConfig.streamKey.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            `}
          >
            {isConnecting ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start Broadcast</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleStopBroadcast}
            disabled={isConnecting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {isConnecting ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Stopping...</span>
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                <span>Stop Broadcast</span>
              </>
            )}
          </button>
        )}

        {/* Quick Setup Help */}
        <div className="p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
          <div className="flex items-start space-x-2">
            <Wifi className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">Quick Setup:</p>
              <p>1. Go to YouTube Studio → Go Live</p>
              <p>2. Choose "Stream" option</p>
              <p>3. Copy your Stream Key and paste above</p>
              <p>4. Add content to your timeline</p>
              <p>5. Click "Start Broadcast"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <h5 className="text-xs text-gray-400 uppercase font-medium mb-2">Timeline Status</h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Tracks:</span>
            <span className="text-white ml-1">{tracks.filter(t => t.isVisible).length}</span>
          </div>
          <div>
            <span className="text-gray-400">Clips:</span>
            <span className="text-white ml-1">{clips.filter(c => c.enabled !== false).length}</span>
          </div>
          <div>
            <span className="text-gray-400">Loop:</span>
            <span className="text-white ml-1">{isLooping ? 'ON' : 'OFF'}</span>
          </div>
          <div>
            <span className="text-gray-400">Ready:</span>
            <span className={clips.length > 0 ? 'text-green-400' : 'text-red-400'}>
              {clips.length > 0 ? 'YES' : 'NO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastPanel;
