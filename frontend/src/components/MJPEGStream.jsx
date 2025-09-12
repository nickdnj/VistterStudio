import React, { useState, useEffect, useRef } from 'react';
import SnapshotStream from './SnapshotStream';

const MJPEGStream = ({ 
  camera, 
  className = "", 
  onLoad = () => {}, 
  onError = () => {},
  showFallback = true 
}) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [useSnapshot, setUseSnapshot] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!camera?.id) return;

    const fetchStreamUrl = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Use our CORS proxy instead of direct camera access
        const proxyUrl = `http://localhost:8080/api/rtmp/cameras/${camera.id}/mjpeg-proxy`;
        setStreamUrl(proxyUrl);
        
      } catch (error) {
        console.error('Error setting up stream URL:', error);
        setHasError(true);
        onError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamUrl();
  }, [camera?.id, onError]);

  const handleImageLoad = () => {
    setIsConnected(true);
    setIsLoading(false);
    setHasError(false);
    onLoad();
  };

  const handleImageError = (e) => {
    console.error('MJPEG stream error:', e);
    setHasError(true);
    setIsConnected(false);
    setIsLoading(false);
    
    // Try snapshot fallback
    console.log('Switching to snapshot mode for camera:', camera?.name);
    setUseSnapshot(true);
    
    onError(e);
  };

  // Use snapshot fallback if MJPEG failed
  if (useSnapshot) {
    return (
      <SnapshotStream
        camera={camera}
        className={className}
        onLoad={onLoad}
        onError={onError}
        showFallback={showFallback}
        refreshInterval={1000}
      />
    );
  }

  if (!streamUrl || (hasError && !useSnapshot)) {
    if (!showFallback) return null;
    
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden`}>
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-6 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-600"></div>
            ))}
          </div>
        </div>
        
        {/* Fallback Content */}
        <div className="text-center text-white z-10">
          <div className="text-4xl mb-3">📹</div>
          <h3 className="text-lg font-semibold mb-2">{camera?.nickname || camera?.name}</h3>
          
          <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2 mb-3">
            <p className="text-orange-400 text-sm font-semibold">
              {isLoading ? '🔄 Connecting...' : '⚠️ Stream Preview Unavailable'}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {camera?.host}:{camera?.port}
            </p>
            {hasError && (
              <p className="text-xs text-red-400 mt-1">
                Enable HTTP/MJPEG on camera for browser preview
              </p>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            💡 Use VLC/OBS for RTMP stream viewing
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1 text-xs text-white">
          {isLoading ? 'CONNECTING' : 'RTMP ONLY'}
        </div>
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 rounded-full ${
            isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
          }`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Connecting to stream...</p>
          </div>
        </div>
      )}
      
      {/* MJPEG Stream */}
      <img
        ref={imgRef}
        src={streamUrl}
        alt={`${camera.nickname || camera.name} Live Stream`}
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        crossOrigin="anonymous"
        style={{ 
          imageRendering: 'auto',
          filter: isConnected ? 'none' : 'grayscale(100%)' 
        }}
      />
      
      {/* Stream Status Overlay */}
      {isConnected && (
        <>
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1 text-xs text-white">
            🔴 LIVE MJPEG
          </div>
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 rounded px-2 py-1 text-xs text-white">
            {camera.host}
          </div>
        </>
      )}
    </div>
  );
};

export default MJPEGStream;
