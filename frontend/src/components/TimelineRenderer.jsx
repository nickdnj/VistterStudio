import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import CameraLoadingOverlay from './CameraLoadingOverlay';
import thumbnailCache from '../utils/thumbnailCache';

/**
 * Timeline Renderer - Renders the timeline composition in the preview
 * This component takes timeline state and renders the appropriate content
 * Includes buffering and pre-loading for smooth stream transitions
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
  const [streamStates, setStreamStates] = useState({}); // Track stream loading states
  const [preloadedStreams, setPreloadedStreams] = useState({}); // Cache for preloaded streams
  const [thumbnails, setThumbnails] = useState({}); // Track thumbnails for each camera
  const [transitionDelays, setTransitionDelays] = useState({}); // Extra delay before showing live feed
  const videoRefs = useRef({});
  const audioRefs = useRef({});
  const preloadRefs = useRef({}); // Hidden elements for preloading

  // Stream state management for smooth transitions
  useEffect(() => {
    if (currentContent?.type === 'camera') {
      const streamId = currentContent.cameraId;
      const streamUrl = getStreamUrl(currentContent.camera, 'webrtc');
      
      // Load cached thumbnail if available
      const cachedThumbnail = thumbnailCache.get(streamId);
      if (cachedThumbnail && !thumbnails[streamId]) {
        setThumbnails(prev => ({ ...prev, [streamId]: cachedThumbnail }));
      }
      
      // Mark stream as loading if not already cached
      if (!preloadedStreams[streamId] && streamStates[streamId] !== 'ready') {
        setStreamStates(prev => ({ ...prev, [streamId]: 'loading' }));
      }
    }
  }, [currentContent, getStreamUrl, preloadedStreams, streamStates, thumbnails]);

  // Sync video playback with timeline time for video assets
  useEffect(() => {
    if (currentContent?.type === 'asset' && currentContent.asset?.category === 'videos') {
      const videoElement = videoRefs.current[currentContent.id];
      if (videoElement && Math.abs(videoElement.currentTime - currentContent.relativeTime) > 0.5) {
        videoElement.currentTime = currentContent.relativeTime;
      }
    }
  }, [currentContent]);

  // Auto-capture thumbnails for HLS streams that can be captured
  useEffect(() => {
    const captureHLSThumbnails = async () => {
      for (const [streamId, videoElement] of Object.entries(videoRefs.current)) {
        if (videoElement && !thumbnails[streamId] && videoElement.videoWidth > 0) {
          try {
            const thumbnail = await thumbnailCache.captureFromElement(streamId, videoElement);
            if (thumbnail) {
              setThumbnails(prev => ({ ...prev, [streamId]: thumbnail }));
            }
          } catch (error) {
            console.warn(`Failed to auto-capture thumbnail for ${streamId}:`, error);
          }
        }
      }
    };

    // Run thumbnail capture periodically for any new video elements
    const interval = setInterval(captureHLSThumbnails, 5000);
    return () => clearInterval(interval);
  }, [thumbnails]);

  // Handle stream loading states
  const handleStreamReady = async (streamId, element = null) => {
    console.log(`Stream ${streamId} is ready`);
    
    // Capture thumbnail from the stream element if possible
    if (element) {
      try {
        const thumbnail = await thumbnailCache.captureFromElement(streamId, element);
        if (thumbnail) {
          setThumbnails(prev => ({ ...prev, [streamId]: thumbnail }));
        }
      } catch (error) {
        console.warn(`Failed to capture thumbnail for ${streamId}:`, error);
      }
    }
    
    // Add transition delay for smooth experience (2-3 seconds)
    setTransitionDelays(prev => ({ ...prev, [streamId]: true }));
    setTimeout(() => {
      setTransitionDelays(prev => ({ ...prev, [streamId]: false }));
    }, 2500); // 2.5 second delay
    
    setStreamStates(prev => ({ ...prev, [streamId]: 'ready' }));
    setPreloadedStreams(prev => ({ ...prev, [streamId]: true }));
  };

  const handleStreamError = (streamId) => {
    console.log(`Stream ${streamId} failed to load`);
    setStreamStates(prev => ({ ...prev, [streamId]: 'error' }));
    setTransitionDelays(prev => ({ ...prev, [streamId]: false }));
  };

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

    // Render camera content with buffering support
    if (currentContent.type === 'camera' && cameras[currentContent.cameraId]) {
      const camera = cameras[currentContent.cameraId];
      const streamId = currentContent.cameraId;
      const streamState = streamStates[streamId] || 'loading';
      const isStreamReady = streamState === 'ready' || preloadedStreams[streamId];
      
      // Handle v4 cameras with WebRTC
      if (camera.product_model === 'HL_CAM4') {
        const shouldShowLoading = !isStreamReady || transitionDelays[streamId];
        const cameraThumb = thumbnails[streamId];
        
        return (
          <div className="w-full h-full relative">
            {/* Enhanced Loading Overlay with Thumbnail */}
            <CameraLoadingOverlay
              camera={camera}
              isLoading={shouldShowLoading}
              thumbnail={cameraThumb}
              streamType="webrtc"
            />
            
            {/* WebRTC Stream */}
            <iframe
              key={`timeline-webrtc-${camera.mac}-${currentContent.startTime}`}
              src={getStreamUrl(camera, 'webrtc')}
              className={`w-full h-full rounded border-0 transition-opacity duration-500 ${
                shouldShowLoading ? 'opacity-0' : 'opacity-100'
              }`}
              allow="camera; microphone; autoplay"
              title={`${camera.nickname} WebRTC Stream`}
              onLoad={() => {
                // Add delay to simulate stream startup time, then mark as ready
                setTimeout(() => handleStreamReady(streamId), 2000);
              }}
              onError={() => handleStreamError(streamId)}
            />
          </div>
        );
      }
      
      // Handle legacy cameras with HLS
      const shouldShowLoading = !isStreamReady || transitionDelays[streamId];
      const cameraThumb = thumbnails[streamId];
      
      return (
        <div className="w-full h-full relative">
          {/* Enhanced Loading Overlay with Thumbnail */}
          <CameraLoadingOverlay
            camera={camera}
            isLoading={shouldShowLoading}
            thumbnail={cameraThumb}
            streamType="hls"
          />
          
          {/* HLS Stream */}
          <VideoPlayer
            key={`timeline-hls-${camera.mac}-${currentContent.startTime}`}
            src={getStreamUrl(camera, 'hls')}
            className={`w-full h-full rounded transition-opacity duration-500 ${
              shouldShowLoading ? 'opacity-0' : 'opacity-100'
            }`}
            autoPlay={isPlaying}
            muted={isMuted}
            onLoadStart={(videoElement) => {
              // Pass the video element for thumbnail capture
              handleStreamReady(streamId, videoElement);
            }}
            onError={() => handleStreamError(streamId)}
            ref={(videoElement) => {
              if (videoElement) {
                videoRefs.current[streamId] = videoElement;
              }
            }}
          />
        </div>
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
