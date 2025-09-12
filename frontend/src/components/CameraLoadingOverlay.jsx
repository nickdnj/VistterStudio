import React from 'react';

/**
 * Camera Loading Overlay - Shows loading state with optional thumbnail background
 * Provides smooth transitions between thumbnail and live feed
 */
const CameraLoadingOverlay = ({ 
  camera, 
  isLoading, 
  thumbnail = null, 
  streamType = 'rtmp',
  className = "",
  onTransitionComplete 
}) => {
  if (!isLoading) return null;

  return (
    <div className={`absolute inset-0 z-10 ${className}`}>
      {/* Thumbnail Background (if available) */}
      {thumbnail && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded"
          style={{ 
            backgroundImage: `url(${thumbnail})`,
            filter: 'brightness(0.4) blur(1px)' // Darken and slightly blur for overlay visibility
          }}
        />
      )}
      
      {/* Fallback Background (if no thumbnail) */}
      {!thumbnail && (
        <div className="absolute inset-0 bg-gray-900 rounded" />
      )}
      
      {/* Loading Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white drop-shadow-lg">
          {/* Spinner */}
          <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-red-500 mx-auto mb-4 drop-shadow-md">
          </div>
          
          {/* Camera Info */}
          <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium mb-1">
              Loading {camera?.nickname || 'Camera'}...
            </p>
            <p className="text-xs text-gray-300">
              {streamType === 'rtmp' ? 'RTMP stream starting' : `${streamType.toUpperCase()} stream starting`}
            </p>
            
            {/* Progress Dots */}
            <div className="flex justify-center mt-3 space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          
          {/* Status Indicator */}
          {thumbnail && (
            <div className="mt-3 text-xs text-green-400 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Using cached preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraLoadingOverlay;
