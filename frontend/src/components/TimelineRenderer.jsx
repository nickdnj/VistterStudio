import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';

/**
 * Timeline Renderer - Renders the timeline composition in the preview
 * This component takes timeline state and renders the appropriate content
 */
const TimelineRenderer = ({ 
  currentContent, 
  currentOverlays, 
  currentAudio, 
  isPlaying, 
  currentTime,
  getStreamUrl,
  cameras,
  className = "" 
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef({});
  const audioRefs = useRef({});

  // Sync video playback with timeline time for video assets
  useEffect(() => {
    if (currentContent?.type === 'asset' && currentContent.asset?.category === 'videos') {
      const videoElement = videoRefs.current[currentContent.id];
      if (videoElement && Math.abs(videoElement.currentTime - currentContent.relativeTime) > 0.5) {
        videoElement.currentTime = currentContent.relativeTime;
      }
    }
  }, [currentContent]);

  // Handle audio elements
  useEffect(() => {
    currentAudio.forEach(audioElement => {
      const audioRef = audioRefs.current[audioElement.id];
      if (audioRef) {
        if (isPlaying && Math.abs(audioRef.currentTime - audioElement.relativeTime) > 0.5) {
          audioRef.currentTime = audioElement.relativeTime;
          audioRef.play().catch(console.error);
        } else if (!isPlaying) {
          audioRef.pause();
        }
      }
    });
  }, [currentAudio, isPlaying]);

  const renderMainContent = () => {
    if (!currentContent) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">Timeline Empty</h3>
            <p>Add cameras or assets to the timeline to see preview</p>
            <p className="text-sm mt-2">Drop items from the sidebar onto timeline tracks</p>
          </div>
        </div>
      );
    }

    // Render camera content
    if (currentContent.type === 'camera' && cameras[currentContent.cameraId]) {
      const camera = cameras[currentContent.cameraId];
      
      // Handle v4 cameras with WebRTC
      if (camera.product_model === 'HL_CAM4') {
        return (
          <iframe
            key={`timeline-webrtc-${camera.mac}-${currentContent.startTime}`}
            src={getStreamUrl(camera, 'webrtc')}
            className="w-full h-full rounded border-0"
            allow="camera; microphone; autoplay"
            title={`${camera.nickname} WebRTC Stream`}
          />
        );
      }
      
      // Handle legacy cameras with HLS
      return (
        <VideoPlayer
          key={`timeline-hls-${camera.mac}-${currentContent.startTime}`}
          src={getStreamUrl(camera, 'hls')}
          className="w-full h-full rounded"
          autoPlay={isPlaying}
          muted={isMuted}
        />
      );
    }

    // Render video asset
    if (currentContent.type === 'asset' && currentContent.asset?.category === 'videos') {
      return (
        <video
          key={`timeline-video-${currentContent.asset.id}-${currentContent.startTime}`}
          ref={el => videoRefs.current[currentContent.id] = el}
          src={`http://localhost:18080${currentContent.asset.url}`}
          className="w-full h-full rounded object-contain"
          autoPlay={isPlaying}
          muted={isMuted}
          onLoadedData={(e) => {
            // Sync to correct time when video loads
            e.target.currentTime = currentContent.relativeTime;
          }}
        />
      );
    }

    // Render image asset
    if (currentContent.type === 'asset' && currentContent.asset?.category === 'images') {
      return (
        <img
          key={`timeline-image-${currentContent.asset.id}-${currentContent.startTime}`}
          src={`http://localhost:18080${currentContent.asset.url}`}
          alt={currentContent.asset.originalName}
          className="w-full h-full rounded object-contain"
        />
      );
    }

    // Fallback for unsupported content
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded">
        <span className="text-gray-400">Unsupported content type: {currentContent.type}</span>
      </div>
    );
  };

  const renderOverlays = () => {
    return currentOverlays.map((overlay, index) => {
      // Calculate overlay position and opacity based on timeline
      const opacity = Math.min(1, overlay.progress * 4); // Fade in over first 25% of duration
      
      return (
        <div
          key={`timeline-overlay-${overlay.id}-${overlay.startTime}`}
          className="absolute bg-black bg-opacity-60 text-white p-3 rounded-lg text-sm shadow-lg transition-opacity duration-300"
          style={{
            top: `${20 + (index * 70)}px`,
            right: '20px',
            zIndex: 10 + index,
            opacity,
            transform: `translateY(${opacity < 1 ? (1 - opacity) * 20 : 0}px)` // Slide in effect
          }}
        >
          {overlay.asset ? (
            overlay.asset.category === 'images' ? (
              <div className="flex items-center space-x-3">
                <img
                  src={`http://localhost:18080${overlay.asset.url}`}
                  alt={overlay.asset.originalName}
                  className="w-16 h-10 object-contain rounded"
                />
                <div>
                  <div className="font-medium">{overlay.asset.originalName}</div>
                  <div className="text-xs text-gray-300">{overlay.trackName}</div>
                </div>
              </div>
            ) : overlay.asset.category === 'videos' ? (
              <div className="flex items-center space-x-3">
                <div className="w-16 h-10 bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-xs">📹</span>
                </div>
                <div>
                  <div className="font-medium">{overlay.asset.originalName}</div>
                  <div className="text-xs text-gray-300">{overlay.trackName}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium">{overlay.asset.originalName}</div>
                <div className="text-xs text-gray-300">{overlay.trackName}</div>
              </div>
            )
          ) : (
            <div>
              <div className="font-medium">{overlay.name || `Overlay ${index + 1}`}</div>
              <div className="text-xs text-gray-300">{overlay.trackName}</div>
            </div>
          )}
          
          {/* Progress indicator for overlay */}
          <div className="mt-2 w-full bg-gray-600 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-100"
              style={{ width: `${overlay.progress * 100}%` }}
            />
          </div>
        </div>
      );
    });
  };

  const renderAudioElements = () => {
    return currentAudio.map(audioElement => (
      <audio
        key={`timeline-audio-${audioElement.id}-${audioElement.startTime}`}
        ref={el => audioRefs.current[audioElement.id] = el}
        src={audioElement.asset ? `http://localhost:18080${audioElement.asset.url}` : ''}
        muted={isMuted}
        style={{ display: 'none' }}
      />
    ));
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Main Content */}
      <div className="relative w-full max-w-4xl mx-auto" style={{ aspectRatio: '16/9' }}>
        {renderMainContent()}
        
        {/* Overlays */}
        {renderOverlays()}
        
        {/* Timeline Info Overlay */}
        {currentContent && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-white text-sm">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🎬</span>
                <span className="font-medium">
                  {currentContent.type === 'camera' 
                    ? cameras[currentContent.cameraId]?.nickname 
                    : currentContent.asset?.originalName || 'Timeline Element'}
                </span>
              </div>
              
              {currentOverlays.length > 0 && (
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <span>📺</span>
                  <span>{currentOverlays.length} overlay{currentOverlays.length !== 1 ? 's' : ''} active</span>
                </div>
              )}
              
              {currentAudio.length > 0 && (
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <span>🔊</span>
                  <span>{currentAudio.length} audio track{currentAudio.length !== 1 ? 's' : ''} active</span>
                </div>
              )}
              
              {/* Element progress bar */}
              <div className="mt-2 w-32">
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-100"
                    style={{ width: `${(currentContent.progress || 0) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Element: {Math.round((currentContent.progress || 0) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-4 right-4 bg-black bg-opacity-70 p-2 rounded-lg text-white hover:bg-opacity-90 transition-all"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
      
      {/* Hidden Audio Elements */}
      {renderAudioElements()}
    </div>
  );
};

export default TimelineRenderer;
