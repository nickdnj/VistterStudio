import { useState } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';
import { useTimelineStore } from '../timeline';
import { TimeFormatter } from '../timeline';
import { calculateTransitionState } from '../timeline/utils/transitions';
import VideoPlayer from './VideoPlayer';
import MJPEGStream from './MJPEGStream';

const PreviewWindow = ({ 
  previewContent, 
  overlays, 
  getStreamUrl, 
  className = "" 
}) => {
  // Get timeline state from store
  const { 
    currentTimeMs, 
    isPlaying, 
    play, 
    pause, 
    setCurrentTime 
  } = useTimelineStore();
  
  const currentTime = currentTimeMs / 1000; // Convert to seconds for compatibility
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlayback = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
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
              {previewContent.type === 'camera' ? previewContent.camera.nickname : 
               previewContent.type === 'asset' ? previewContent.asset.originalName : 'Empty'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-gray-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-black rounded-b-lg overflow-hidden relative flex items-center justify-center p-2">
        {previewContent ? (
          <div className="relative w-full max-w-4xl mx-auto" style={{ aspectRatio: '16/9' }}>
            {/* Main Content */}
            {previewContent.type === 'camera' ? (
              previewContent.camera.type === 'rtmp' ? (
                // RTMP cameras with MJPEG preview
                <MJPEGStream
                  camera={previewContent.camera}
                  className="w-full h-full rounded"
                  showFallback={true}
                />
              ) : (
                // Unknown camera type fallback
                <div className="w-full h-full rounded flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">❓</div>
                    <h3 className="text-xl font-semibold mb-2">Unknown Camera</h3>
                    <p className="text-sm text-gray-400">Type: {previewContent.camera.type || 'Unknown'}</p>
                  </div>
                </div>
              )
            ) : previewContent.type === 'asset' && previewContent.asset.category === 'videos' ? (
              <video
                key={`asset-${previewContent.asset.id}`}
                src={`http://localhost:8080${previewContent.asset.url}`}
                className="w-full h-full rounded object-contain"
                autoPlay={isPlaying}
                muted={isMuted}
                loop
              />
            ) : previewContent.type === 'asset' && previewContent.asset.category === 'images' ? (
              <img
                key={`asset-${previewContent.asset.id}`}
                src={`http://localhost:8080${previewContent.asset.url}`}
                alt={previewContent.asset.originalName}
                className="w-full h-full rounded object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded">
                <span className="text-gray-400">Unsupported content type</span>
              </div>
            )}

            {/* Overlays - Render image assets as full-size overlays */}
            {overlays
              .filter(overlay => overlay.asset?.category === 'images')
              .map((overlay, index) => {
                // Get base visual properties with defaults
                const baseOpacity = (overlay.opacity || 100) / 100;
                const baseScale = (overlay.scale || 100) / 100;
                const basePositionX = overlay.positionX || 0;
                const basePositionY = overlay.positionY || 0;

                // Calculate base transform values
                const baseTranslateX = basePositionX * 0.5; // Convert -100/100 to -50%/50%
                const baseTranslateY = basePositionY * 0.5; // Convert -100/100 to -50%/50%

                // Calculate transition state
                const transitionState = calculateTransitionState(
                  overlay,
                  currentTime * 1000, // Convert to milliseconds
                  baseOpacity,
                  baseScale,
                  baseTranslateX,
                  baseTranslateY
                );

                // Apply transition state
                const finalOpacity = transitionState.opacity;
                const finalScale = transitionState.scale;
                const finalTranslateX = transitionState.translateX;
                const finalTranslateY = transitionState.translateY;

                // Don't render if completely transparent
                if (finalOpacity <= 0) {
                  return null;
                }

                return (
                  <img
                    key={`overlay-${overlay.id}`}
                    src={`http://localhost:8080${overlay.asset.url}`}
                    alt={overlay.asset.originalName}
                    className="absolute top-1/2 left-1/2 object-contain rounded transition-all duration-100 ease-out"
                    style={{
                      opacity: finalOpacity,
                      transform: `translate(-50%, -50%) translate(${finalTranslateX}%, ${finalTranslateY}%) scale(${finalScale})`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                      zIndex: 10 + index
                    }}
                  />
                );
              })}

            {/* Non-image overlays as info boxes */}
            {overlays
              .filter(overlay => overlay.asset?.category !== 'images')
              .map((overlay, index) => (
                <div
                  key={`overlay-info-${overlay.id}`}
                  className="absolute bg-black bg-opacity-60 text-white p-2 rounded text-sm"
                  style={{
                    top: `${20 + (index * 60)}px`,
                    right: '20px',
                    zIndex: 20 + index
                  }}
                >
                  <span>{overlay.asset?.originalName || overlay.name || `Overlay ${index + 1}`}</span>
                </div>
              ))}

            {/* Timeline Info Overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-white text-sm">
              <div className="space-y-1">
                <div>⏱️ {TimeFormatter.formatTime(currentTimeMs)} / 10:00</div>
                <div>🎬 {previewContent.element?.name || 'Timeline Element'}</div>
                {overlays.length > 0 && (
                  <div>📺 {overlays.length} overlay{overlays.length !== 1 ? 's' : ''}</div>
                )}
              </div>
            </div>

            {/* Playback Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-3 bg-black bg-opacity-70 rounded-lg px-4 py-2">
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
                <button 
                  onClick={() => setCurrentTime(0)}
                  className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Square className="h-4 w-4 text-white" />
                </button>
                
                {/* Timeline Scrubber */}
                <div className="flex items-center space-x-2">
                  <span className="text-white text-xs font-mono">{TimeFormatter.formatTime(currentTimeMs)}</span>
                  <input
                    type="range"
                    min="0"
                    max={600000} // 10 minutes in ms
                    value={currentTimeMs}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-white text-xs font-mono">10:00</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">Timeline Empty</h3>
            <p>Add cameras or assets to the timeline to see preview</p>
            <p className="text-sm mt-2">Drop items from the sidebar onto timeline tracks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewWindow;
