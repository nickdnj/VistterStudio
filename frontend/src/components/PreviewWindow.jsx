import { useState } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Maximize2, Settings, SkipBack, SkipForward } from 'lucide-react';
import TimelineRenderer from './TimelineRenderer';

const PreviewWindow = ({ 
  currentTime, 
  isPlaying, 
  setIsPlaying, 
  setCurrentTime,
  duration,
  previewContent, 
  overlays,
  currentAudio = [],
  getStreamUrl,
  cameras = {},
  timeline,
  className = "" 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-dark rounded-lg border border-gray-700 flex flex-col ${className}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className={`text-sm font-medium ${isPlaying ? 'text-green-500' : 'text-gray-500'}`}>
              {isPlaying ? 'PLAYING' : 'PAUSED'}
            </span>
          </div>
          <span className="text-white font-medium">
            Timeline Preview
          </span>
          {previewContent && (
            <span className="text-gray-400 text-sm">
              {previewContent.type === 'camera' ? 
                cameras[previewContent.cameraId]?.nickname || 'Camera' : 
                previewContent.asset?.originalName || 'Asset'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview Content - Timeline Renderer */}
      <div className="flex-1 bg-black rounded-b-lg overflow-hidden relative flex items-center justify-center p-2">
        <TimelineRenderer
          currentContent={previewContent}
          currentOverlays={overlays}
          currentAudio={currentAudio}
          isPlaying={isPlaying}
          currentTime={currentTime}
          getStreamUrl={getStreamUrl}
          cameras={cameras}
          className="w-full h-full"
        />
      </div>

      {/* Enhanced Playback Controls */}
      <div className="bg-dark border-t border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Previous Element */}
            <button 
              onClick={() => timeline?.jumpToPrevious()}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
              title="Previous Element"
            >
              <SkipBack className="h-4 w-4 text-white" />
            </button>
            
            {/* Play/Pause */}
            <button 
              onClick={togglePlayback}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" />
              )}
            </button>
            
            {/* Stop */}
            <button 
              onClick={() => timeline?.stop()}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Square className="h-4 w-4 text-white" />
            </button>
            
            {/* Next Element */}
            <button 
              onClick={() => timeline?.jumpToNext()}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
              title="Next Element"
            >
              <SkipForward className="h-4 w-4 text-white" />
            </button>
            
            {/* Timeline Scrubber */}
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs font-mono">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-40 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white text-xs font-mono">{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
              <Maximize2 className="h-4 w-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewWindow;