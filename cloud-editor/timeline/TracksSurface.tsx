/**
 * TracksSurface - Timeline tracks with mathematical positioning
 * 
 * This component renders track content using the TimeScale coordinate system
 * for perfect alignment with the ruler at all zoom levels.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useTimelineViewport } from '../../timeline/viewport/TimelineViewportContext';
import { Camera, Image, Video, Music, FileText } from 'lucide-react';

interface TracksSurfaceProps {
  tracks: any[];
  onAddElement: (trackId: string, element: any) => void;
  onUpdateElement: (trackId: string, elementId: string, updates: any) => void;
  onRemoveElement: (trackId: string, elementId: string) => void;
}

interface TrackElementProps {
  element: any;
  timeScale: any;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
}

function TrackElement({ element, timeScale, onUpdate, onRemove }: TrackElementProps) {
  const startMs = element.startTime * 1000;
  const durationMs = element.duration * 1000;
  const leftPx = timeScale.xOf(startMs) - timeScale.contentOffsetPx; // Remove content offset for grid positioning
  const widthPx = timeScale.durationToPx(durationMs);

  const getElementIcon = () => {
    switch (element.type) {
      case 'camera': return Camera;
      case 'images': return Image;
      case 'videos': return Video;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  const getElementColor = () => {
    switch (element.type) {
      case 'camera': return 'bg-blue-600 border-blue-500';
      case 'images': return 'bg-green-600 border-green-500';
      case 'videos': return 'bg-purple-600 border-purple-500';
      case 'audio': return 'bg-yellow-600 border-yellow-500';
      default: return 'bg-gray-600 border-gray-500';
    }
  };

  const Icon = getElementIcon();

  return (
    <div
      className={`absolute h-12 border-2 rounded cursor-move transition-colors hover:opacity-80 ${getElementColor()}`}
      style={{
        left: `${leftPx}px`,
        width: `${Math.max(widthPx, 60)}px`, // Minimum width for visibility
        top: '8px'
      }}
      title={`${element.name} (${element.duration}s)`}
    >
      <div className="flex items-center h-full px-2 space-x-2">
        {element.type === 'images' && element.asset?.url ? (
          <img
            src={`http://localhost:8080${element.asset.url}`}
            alt={element.asset.originalName}
            className="h-8 w-8 object-cover rounded flex-shrink-0"
          />
        ) : (
          <Icon className="h-4 w-4 text-white flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-medium truncate">
            {element.name}
          </div>
          <div className="text-white text-xs opacity-75">
            {element.duration}s
          </div>
        </div>
      </div>
      
      {/* Resize handles */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white bg-opacity-50 cursor-ew-resize hover:bg-opacity-75" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white bg-opacity-50 cursor-ew-resize hover:bg-opacity-75" />
    </div>
  );
}

function Track({ 
  track, 
  timeScale, 
  onAddElement, 
  onUpdateElement, 
  onRemoveElement 
}: {
  track: any;
  timeScale: any;
  onAddElement: (element: any) => void;
  onUpdateElement: (elementId: string, updates: any) => void;
  onRemoveElement: (elementId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Get the drop coordinates relative to the tracks container
    const rect = event.currentTarget.getBoundingClientRect();
    const dropX = event.clientX - rect.left;
    
    // Convert pixel position to time using TimeScale
    // In the new timeline, dropX is relative to the tracks content area (after labels)
    // We DON'T need to add contentOffsetPx because the CSS grid already handles the offset
    const dropTimeMs = timeScale.tOf(dropX);
    const dropTimeSeconds = Math.max(0, dropTimeMs / 1000);
    
    console.log('Drop event:', {
      clientX: event.clientX,
      rectLeft: rect.left,
      dropX: dropX,
      dropTimeMs: dropTimeMs,
      dropTimeSeconds: dropTimeSeconds,
      contentOffset: timeScale.contentOffsetPx,
      msPerPx: timeScale.msPerPx
    });
    
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'));
      console.log('Parsed drop data:', data);
      
      if (data.type === 'asset') {
        const newElement = {
          id: `element_${Date.now()}`,
          type: data.asset.category,
          name: data.asset.originalName,
          startTime: dropTimeSeconds,
          duration: data.asset.category === 'images' ? 5 : 10,
          assetUrl: data.asset.url,
          asset: data.asset
        };
        console.log('Adding asset element:', newElement);
        onAddElement(newElement);
      } else if (data.type === 'camera') {
        const newElement = {
          id: `element_${Date.now()}`,
          type: 'camera',
          name: data.camera.nickname,
          startTime: dropTimeSeconds,
          duration: 10,
          cameraId: data.cameraId,
          camera: data.camera
        };
        console.log('Adding camera element:', newElement);
        onAddElement(newElement);
      }
    } catch (error) {
      console.error('Error parsing drop data:', error);
    }
  }, [timeScale, onAddElement]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDropWrapper = useCallback((event: React.DragEvent) => {
    setIsDragOver(false);
    handleDrop(event);
  }, [handleDrop]);

  return (
    <div
      className={`relative border-b border-gray-700 transition-colors ${
        isDragOver 
          ? 'bg-blue-900 border-blue-500' 
          : 'bg-gray-900 hover:bg-gray-850'
      }`}
      style={{ height: 'var(--timeline-track-height)' }}
      onDrop={handleDropWrapper}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Track elements */}
      {track.elements.map((element: any) => (
        <TrackElement
          key={element.id}
          element={element}
          timeScale={timeScale}
          onUpdate={(updates) => onUpdateElement(element.id, updates)}
          onRemove={() => onRemoveElement(element.id)}
        />
      ))}
      
      {/* Drop zone indicator */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none ${
        isDragOver ? 'opacity-70' : 'opacity-0 hover:opacity-30'
      }`}>
        <div className={`text-sm font-medium ${
          isDragOver ? 'text-blue-300' : 'text-gray-500'
        }`}>
          {isDragOver ? 'Drop here to add to timeline' : 'Drop items here'}
        </div>
      </div>
    </div>
  );
}

export default function TracksSurface({ 
  tracks, 
  onAddElement, 
  onUpdateElement, 
  onRemoveElement 
}: TracksSurfaceProps) {
  const { state } = useTimelineViewport();
  const { timeScale } = state;

  // Generate time grid lines for visual reference
  const gridLines = useMemo(() => {
    const [viewStartMs, viewEndMs] = timeScale.getVisibleRange(state.viewportWidthPx);
    const lines: number[] = [];
    
    // Generate grid lines every second when zoomed in enough
    if (timeScale.msPerPx < 200) {
      const interval = 1000; // 1 second
      const startLine = Math.floor(viewStartMs / interval) * interval;
      const endLine = Math.ceil(viewEndMs / interval) * interval;
      
      for (let timeMs = startLine; timeMs <= endLine; timeMs += interval) {
        if (timeMs >= viewStartMs && timeMs <= viewEndMs) {
          lines.push(timeScale.xOf(timeMs) - timeScale.contentOffsetPx); // Remove content offset for grid positioning
        }
      }
    }
    
    return lines;
  }, [timeScale, state.viewportWidthPx]);

  return (
    <div className="relative min-h-full">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none">
        {gridLines.map((x, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-px bg-gray-700 opacity-30"
            style={{ left: `${x}px` }}
          />
        ))}
      </div>
      
      {/* Tracks */}
      <div className="relative">
        {tracks.map((track) => (
          <Track
            key={track.id}
            track={track}
            timeScale={timeScale}
            onAddElement={(element) => onAddElement(track.id, element)}
            onUpdateElement={(elementId, updates) => onUpdateElement(track.id, elementId, updates)}
            onRemoveElement={(elementId) => onRemoveElement(track.id, elementId)}
          />
        ))}
      </div>
      
      {/* Minimum height for dropping when no tracks */}
      {tracks.length === 0 && (
        <div className="h-32 flex items-center justify-center text-gray-500">
          No tracks available. Add a track to get started.
        </div>
      )}
    </div>
  );
}
