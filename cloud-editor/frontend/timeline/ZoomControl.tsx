/**
 * ZoomControl - Time-domain zoom controls
 * 
 * This component provides zoom controls that modify the time scale (msPerPx)
 * rather than CSS scaling, ensuring consistent typography and perfect alignment.
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTimelineViewport, useZoomControls } from '../../timeline/viewport/TimelineViewportContext';
import { ZOOM_LEVELS, getClosestZoomLevel } from '../../timeline/viewport/TimeScale';

interface ZoomControlProps {
  className?: string;
  showPercentage?: boolean;
}

export default function ZoomControl({ className = '', showPercentage = true }: ZoomControlProps) {
  const { state } = useTimelineViewport();
  const { msPerPx, setZoom, zoomIn, zoomOut, zoomToFit } = useZoomControls();
  const sliderRef = useRef<HTMLInputElement>(null);
  
  // Convert msPerPx to slider value (0-100)
  const zoomToSliderValue = useCallback((msPerPx: number): number => {
    const minZoom = ZOOM_LEVELS[0];
    const maxZoom = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    
    // Use logarithmic scale for more intuitive zooming
    const logMin = Math.log(minZoom);
    const logMax = Math.log(maxZoom);
    const logCurrent = Math.log(msPerPx);
    
    // Invert the scale so left = zoomed in, right = zoomed out
    return 100 - ((logCurrent - logMin) / (logMax - logMin)) * 100;
  }, []);
  
  // Convert slider value to msPerPx
  const sliderValueToZoom = useCallback((value: number): number => {
    const minZoom = ZOOM_LEVELS[0];
    const maxZoom = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    
    // Invert the scale
    const normalizedValue = (100 - value) / 100;
    
    // Use logarithmic scale
    const logMin = Math.log(minZoom);
    const logMax = Math.log(maxZoom);
    const logValue = logMin + normalizedValue * (logMax - logMin);
    
    return getClosestZoomLevel(Math.exp(logValue));
  }, []);
  
  const currentSliderValue = zoomToSliderValue(msPerPx);
  
  // Calculate zoom percentage (higher percentage = more zoomed in)
  const zoomPercentage = Math.round(zoomToSliderValue(msPerPx));
  
  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = Number(event.target.value);
    const newMsPerPx = sliderValueToZoom(sliderValue);
    
    // Anchor zoom at viewport center
    const viewportCenter = state.viewportWidthPx / 2;
    setZoom(newMsPerPx, viewportCenter);
  }, [sliderValueToZoom, setZoom, state.viewportWidthPx]);
  
  const handleZoomIn = useCallback(() => {
    const viewportCenter = state.viewportWidthPx / 2;
    zoomIn(viewportCenter);
  }, [zoomIn, state.viewportWidthPx]);
  
  const handleZoomOut = useCallback(() => {
    const viewportCenter = state.viewportWidthPx / 2;
    zoomOut(viewportCenter);
  }, [zoomOut, state.viewportWidthPx]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return; // Don't interfere with input fields
      
      if (event.key === '=' || event.key === '+') {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleZoomIn();
        }
      } else if (event.key === '-' || event.key === '_') {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleZoomOut();
        }
      } else if (event.key === '0') {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          zoomToFit();
        }
      }
    };
    
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        
        // Get mouse position relative to viewport
        const rect = document.documentElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        
        if (event.deltaY < 0) {
          zoomIn(mouseX);
        } else {
          zoomOut(mouseX);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [handleZoomIn, handleZoomOut, zoomToFit, zoomIn, zoomOut]);
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        className="p-1 hover:bg-gray-700 rounded transition-colors"
        title="Zoom Out (Ctrl+-)"
        disabled={msPerPx >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
      >
        <ZoomOut className="h-4 w-4 text-gray-400" />
      </button>
      
      {/* Zoom Slider */}
      <div className="flex items-center space-x-2">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          step="1"
          value={currentSliderValue}
          onChange={handleSliderChange}
          className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          title={`Zoom: ${zoomPercentage}%`}
        />
        {showPercentage && (
          <span className="text-xs text-gray-400 font-mono w-10 text-right">
            {zoomPercentage}%
          </span>
        )}
      </div>
      
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        className="p-1 hover:bg-gray-700 rounded transition-colors"
        title="Zoom In (Ctrl++)"
        disabled={msPerPx <= ZOOM_LEVELS[0]}
      >
        <ZoomIn className="h-4 w-4 text-gray-400" />
      </button>
      
      {/* Zoom to Fit Button */}
      <button
        onClick={zoomToFit}
        className="p-1 hover:bg-gray-700 rounded transition-colors"
        title="Zoom to Fit (Ctrl+0)"
      >
        <Maximize2 className="h-4 w-4 text-gray-400" />
      </button>
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 font-mono">
          {msPerPx.toFixed(1)}ms/px
        </div>
      )}
    </div>
  );
}
