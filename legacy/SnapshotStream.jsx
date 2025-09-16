import React, { useState, useEffect, useRef } from 'react';

const SnapshotStream = ({ 
  camera, 
  className = "", 
  onLoad = () => {}, 
  onError = () => {},
  showFallback = true,
  refreshInterval = 1000 // Refresh every 1 second
}) => {
  const [currentSnapshot, setCurrentSnapshot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const imgRef = useRef(null);

  const generateSnapshotUrl = () => {
    if (!camera?.id) return '';
    // Add timestamp to prevent caching
    return `http://localhost:8080/api/rtmp/cameras/${camera.id}/snapshot?t=${Date.now()}`;
  };

  const fetchSnapshot = async () => {
    if (!camera?.id) return;
    
    try {
      const newUrl = generateSnapshotUrl();
      setCurrentSnapshot(newUrl);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error generating snapshot URL:', error);
      setHasError(true);
      onError(error);
    }
  };

  useEffect(() => {
    if (!camera?.id) return;

    // Initial fetch
    fetchSnapshot();
    
    // Set up periodic refresh
    intervalRef.current = setInterval(fetchSnapshot, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [camera?.id, refreshInterval]);

  const handleImageLoad = () => {
    setIsConnected(true);
    setIsLoading(false);
    setHasError(false);
    onLoad();
  };

  const handleImageError = (e) => {
    console.error('Snapshot error:', e);
    setHasError(true);
    setIsConnected(false);
    onError(e);
  };

  if (!currentSnapshot || (hasError && !showFallback)) {
    return null;
  }

  if (hasError && showFallback) {
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
              ⚠️ Camera Preview Unavailable
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {camera?.host}:{camera?.port}
            </p>
            <p className="text-xs text-red-400 mt-1">
              Check camera connectivity and HTTP settings
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            💡 Use VLC/OBS for RTMP stream viewing
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1 text-xs text-white">
          OFFLINE
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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
            <p className="text-sm">Loading preview...</p>
          </div>
        </div>
      )}
      
      {/* Snapshot Image */}
      <img
        ref={imgRef}
        src={currentSnapshot}
        alt={`${camera.nickname || camera.name} Live Preview`}
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ 
          imageRendering: 'auto',
          filter: isConnected ? 'none' : 'grayscale(100%)' 
        }}
      />
      
      {/* Stream Status Overlay */}
      {isConnected && (
        <>
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1 text-xs text-white">
            🔴 LIVE PREVIEW
          </div>
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 rounded px-2 py-1 text-xs text-white">
            {camera.host}
          </div>
          {lastUpdate && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1 text-xs text-white">
              {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </>
      )}
      
      {/* Refresh Indicator */}
      <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse opacity-50"></div>
      </div>
    </div>
  );
};

export default SnapshotStream;
