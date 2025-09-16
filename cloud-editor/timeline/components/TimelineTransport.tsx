import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Repeat,
  Radio
} from 'lucide-react';
import { useTimelineStore } from '../state/store';
import { TimeFormatter, TimeScale } from '../models/TimeScale';
import { PlaybackRate } from '../models/types';
import { io } from 'socket.io-client';

interface TimelineTransportProps {
  className?: string;
}

export const TimelineTransport: React.FC<TimelineTransportProps> = ({ className = '' }) => {
  const {
    currentTimeMs,
    isPlaying,
    isLooping,
    playbackRate,
    viewport,
    tracks,
    clips,
    play,
    pause,
    stop,
    setCurrentTime,
    setPlaybackRate,
    toggleLoop,
    setZoom,
    addTrack,
    clearTimeline,
    undo,
    redo,
    canUndo,
    canRedo,
    getDynamicDuration,
  } = useTimelineStore();
  
  // Broadcast state
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState({
    isLive: false,
    isRecording: false,
    platform: null,
    viewers: 0,
    uptime: 0
  });
  const [isStarting, setIsStarting] = useState(false);
  
  // Initialize broadcast connection
  useEffect(() => {
    const broadcastSocket = io('http://localhost:3001');
    setSocket(broadcastSocket);
    
    broadcastSocket.on('connect', () => {
      setIsConnected(true);
    });
    
    broadcastSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    
    broadcastSocket.on('broadcast:status', (status: any) => {
      setBroadcastStatus(status);
    });
    
    broadcastSocket.on('broadcast:started', (status: any) => {
      setBroadcastStatus(status);
      setIsStarting(false);
    });
    
    broadcastSocket.on('broadcast:stopped', (status: any) => {
      setBroadcastStatus(status);
      setIsStarting(false);
    });
    
    broadcastSocket.on('broadcast:error', (error: any) => {
      console.error('Broadcast error:', error);
      setIsStarting(false);
      alert(`Broadcast error: ${error.message}`);
    });
    
    return () => {
      broadcastSocket.disconnect();
    };
  }, []);

  // Calculate total timeline duration dynamically based on main track
  const totalDurationMs = getDynamicDuration();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ': // Spacebar
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'Home':
          e.preventDefault();
          setCurrentTime(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentTime(totalDurationMs);
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          setPlaybackRate(0.5);
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setPlaybackRate(2);
          break;
        case 'z':
        case 'Z':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (confirm('Are you sure you want to clear the entire timeline? This cannot be undone.')) {
              clearTimeline();
            }
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          toggleLoop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, totalDurationMs, play, pause, setCurrentTime, setPlaybackRate, undo, redo, clearTimeline, toggleLoop]);

  // Jump to start/end
  const jumpToStart = () => setCurrentTime(0);
  const jumpToEnd = () => setCurrentTime(totalDurationMs);
  
  // Broadcast functions
  const handleGoLive = () => {
    // Check if any platforms are configured
    const savedCredentials = localStorage.getItem('vistter-broadcast-credentials');
    let hasConfiguredPlatform = false;
    
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        hasConfiguredPlatform = Object.values(credentials).some((cred: any) => 
          cred.enabled && cred.streamKey
        );
      } catch (error) {
        console.error('Error reading credentials:', error);
      }
    }
    
    if (!hasConfiguredPlatform) {
      alert('Please configure at least one streaming platform in the Broadcast tab first!');
      return;
    }
    
    if (!isConnected) {
      alert('Broadcast server is not connected. Please check if the broadcast service is running.');
      return;
    }
    
    // Get the first enabled platform
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        const enabledPlatform = Object.entries(credentials).find(([_, cred]: [string, any]) => 
          cred.enabled && cred.streamKey
        );
        
        if (enabledPlatform) {
          const [platformId, creds] = enabledPlatform;
          const savedSettings = localStorage.getItem('vistter-stream-settings');
          const streamSettings = savedSettings ? JSON.parse(savedSettings) : {
            resolution: '1920x1080',
            framerate: 30,
            bitrate: 3500
          };
          
          const config = {
            platform: platformId,
            streamKey: (creds as any).streamKey,
            rtmpUrl: platformId === 'custom' ? (creds as any).rtmpUrl : undefined,
            ...streamSettings
          };
          
          setIsStarting(true);
          
          // Send timeline data to broadcast server
          socket?.emit('timeline:update', { tracks, clips });
          
          // Start broadcast
          socket?.emit('broadcast:start', config);
        }
      } catch (error) {
        console.error('Error starting broadcast:', error);
        alert('Error starting broadcast. Please check your configuration.');
      }
    }
  };
  
  const handleStopLive = () => {
    socket?.emit('broadcast:stop');
  };
  
  // Format time for display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Rate buttons
  const rateButtons: { rate: PlaybackRate; label: string }[] = [
    { rate: 0.5, label: '0.5×' },
    { rate: 1, label: '1×' },
    { rate: 2, label: '2×' },
  ];

  // Zoom presets
  const zoomPresets = TimeScale.getZoomPresets();

  return (
    <div className={`flex items-center justify-between p-4 bg-gray-800 border-t border-gray-700 ${className}`}>
      {/* Left side - Playback controls */}
      <div className="flex items-center space-x-3">
        {/* Jump to start */}
        <button
          onClick={jumpToStart}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Jump to start (Home)"
        >
          <SkipBack className="h-4 w-4 text-white" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? pause : play}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Stop */}
        <button
          onClick={stop}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Stop"
        >
          <Square className="h-4 w-4 text-white" />
        </button>

        {/* Jump to end */}
        <button
          onClick={jumpToEnd}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Jump to end (End)"
        >
          <SkipForward className="h-4 w-4 text-white" />
        </button>

        {/* Repeat/Loop button */}
        <button
          onClick={toggleLoop}
          className={`
            p-2 rounded-lg transition-colors ml-4
            ${isLooping 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }
          `}
          title={`${isLooping ? 'Disable' : 'Enable'} loop/repeat (R)`}
        >
          <Repeat className="h-4 w-4" />
        </button>

        {/* Go Live Button */}
        <div className="ml-6 flex items-center space-x-2">
          {!broadcastStatus.isLive ? (
            <button
              onClick={handleGoLive}
              disabled={isStarting || !isConnected}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              title="Start live broadcast"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="text-sm">Starting...</span>
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4" />
                  <span className="text-sm">Go Live</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-red-600 rounded-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">LIVE</span>
                {broadcastStatus.viewers > 0 && (
                  <span className="text-red-200 text-xs">
                    {broadcastStatus.viewers.toLocaleString()} viewers
                  </span>
                )}
              </div>
              <button
                onClick={handleStopLive}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                title="Stop broadcast"
              >
                ⏹️ Stop
              </button>
            </div>
          )}
        </div>

        {/* Playback rate */}
        <div className="flex items-center space-x-1 ml-4">
          <span className="text-xs text-gray-400">Rate:</span>
          {rateButtons.map(({ rate, label }) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`
                px-2 py-1 text-xs rounded transition-colors
                ${playbackRate === rate 
                  ? 'bg-primary text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
              title={`Playback rate ${label} ${rate === 0.5 ? '(J)' : rate === 1 ? '(K)' : '(L)'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-600 ml-4" />

        {/* Timeline management controls */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={`
              p-2 rounded-lg transition-colors
              ${canUndo() 
                ? 'hover:bg-gray-700 text-white' 
                : 'text-gray-600 cursor-not-allowed'
              }
            `}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo()}
            className={`
              p-2 rounded-lg transition-colors
              ${canRedo() 
                ? 'hover:bg-gray-700 text-white' 
                : 'text-gray-600 cursor-not-allowed'
              }
            `}
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear the entire timeline? This cannot be undone.')) {
                clearTimeline();
              }
            }}
            className="p-2 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
            title="Clear Timeline (Ctrl+Delete)"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center - Timecode display */}
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div className="text-lg font-mono text-white">
            {TimeFormatter.formatTime(currentTimeMs)}
          </div>
          <div className="text-xs text-gray-400">
            / {TimeFormatter.formatTime(totalDurationMs)}
          </div>
        </div>
      </div>

      {/* Right side - Zoom and track controls */}
      <div className="flex items-center space-x-3">
        {/* Zoom presets */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-400">Zoom:</span>
          {zoomPresets.map(({ label, durationMs }) => (
            <button
              key={label}
              onClick={() => setZoom(durationMs)}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title={`Show ${label} in timeline`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Add track */}
        <button
          onClick={() => addTrack({
            name: `Track ${tracks.length + 1}`,
            kind: 'overlay',
            color: 'bg-purple-600',
          })}
          className="flex items-center space-x-2 px-3 py-1 bg-primary hover:bg-blue-600 text-white text-sm rounded transition-colors"
          title="Add new track"
        >
          <Plus className="h-4 w-4" />
          <span>Add Track</span>
        </button>

        {/* Timeline stats */}
        <div className="text-xs text-gray-400">
          <div>{tracks.length} tracks</div>
          <div>{clips.length} clips</div>
        </div>
      </div>
    </div>
  );
};
