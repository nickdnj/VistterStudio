import React, { useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useTimelineStore } from '../state/store';
import { Clip } from '../models/types';

interface ClipViewProps {
  clip: Clip;
  trackId: string;
  className?: string;
}

export const ClipView: React.FC<ClipViewProps> = ({ clip, trackId, className = '' }) => {
  const {
    viewport,
    timeScale,
    selectedClipId,
    dragState,
    selectClip,
    updateClip,
    removeClip,
    startDrag,
    endDrag,
    snapTime,
  } = useTimelineStore();

  const isSelected = selectedClipId === clip.id;
  const isDragging = dragState.isDragging && dragState.clipId === clip.id;

  // Calculate clip position and size (relative to content area, not including contentOffsetPx)
  const leftPx = (clip.startMs - viewport.viewStartMs) / viewport.msPerPx;
  const widthPx = Math.max(20, clip.durationMs / viewport.msPerPx); // Minimum 20px width

  // Get clip color based on kind
  const getClipColor = (kind: string, enabled: boolean = true) => {
    const opacity = enabled ? '' : ' opacity-50';
    switch (kind) {
      case 'camera':
      case 'video':
        return `bg-blue-500 border-blue-600${opacity}`;
      case 'overlay':
        return `bg-green-500 border-green-600${opacity}`;
      case 'audio':
        return `bg-orange-500 border-orange-600${opacity}`;
      default:
        return `bg-gray-500 border-gray-600${opacity}`;
    }
  };

  // Handle clip selection
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectClip(clip.id);
  }, [clip.id, selectClip]);

  // Handle clip drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    selectClip(clip.id);
    
    startDrag({
      dragType: 'clip',
      clipId: clip.id,
      startX: e.clientX,
      startValue: clip.startMs,
      originalStartMs: clip.startMs,
      originalDurationMs: clip.durationMs,
    });
  }, [clip.id, clip.startMs, clip.durationMs, selectClip, startDrag]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    selectClip(clip.id);
    
    startDrag({
      dragType: side === 'left' ? 'resize-left' : 'resize-right',
      clipId: clip.id,
      startX: e.clientX,
      startValue: side === 'left' ? clip.startMs : clip.durationMs,
      originalStartMs: clip.startMs,
      originalDurationMs: clip.durationMs,
    });
  }, [clip.id, clip.startMs, clip.durationMs, selectClip, startDrag]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaTime = deltaX * viewport.msPerPx;

    switch (dragState.dragType) {
      case 'clip': {
        const newStartMs = Math.max(0, dragState.originalStartMs! + deltaTime);
        const snappedStartMs = snapTime(newStartMs);
        updateClip(clip.id, { startMs: snappedStartMs });
        break;
      }
      case 'resize-left': {
        const newStartMs = Math.max(0, dragState.originalStartMs! + deltaTime);
        const newDurationMs = Math.max(500, dragState.originalDurationMs! - deltaTime);
        const snappedStartMs = snapTime(newStartMs);
        const adjustedDurationMs = dragState.originalStartMs! + dragState.originalDurationMs! - snappedStartMs;
        
        if (adjustedDurationMs >= 500) {
          updateClip(clip.id, { 
            startMs: snappedStartMs, 
            durationMs: adjustedDurationMs 
          });
        }
        break;
      }
      case 'resize-right': {
        const newDurationMs = Math.max(500, dragState.originalDurationMs! + deltaTime);
        const snappedEndMs = snapTime(clip.startMs + newDurationMs);
        const adjustedDurationMs = snappedEndMs - clip.startMs;
        
        if (adjustedDurationMs >= 500) {
          updateClip(clip.id, { durationMs: adjustedDurationMs });
        }
        break;
      }
    }
  }, [isDragging, dragState, viewport.msPerPx, clip.id, clip.startMs, snapTime, updateClip]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      endDrag();
    }
  }, [isDragging, endDrag]);

  // Set up global mouse events during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.dragType === 'clip' ? 'grabbing' : 'ew-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, dragState.dragType]);

  // Handle clip deletion
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeClip(clip.id);
  }, [clip.id, removeClip]);

  // Format duration for display
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if clip is outside visible area
  const rightPx = leftPx + widthPx;
  if (rightPx < 0 || leftPx > viewport.viewportWidthPx) {
    return null;
  }

  return (
    <div
      className={`
        absolute top-1 h-14 rounded border cursor-move overflow-hidden group
        ${getClipColor(clip.kind, clip.enabled)}
        ${isSelected ? 'ring-2 ring-white ring-opacity-50' : ''}
        ${isDragging ? 'shadow-lg z-10' : 'z-0'}
        transition-shadow duration-150
        ${className}
      `}
      style={{
        left: leftPx,
        width: widthPx,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Clip content */}
      <div className="p-2 h-full flex flex-col justify-between text-white text-xs">
        <div className="font-medium truncate">
          {clip.name || 'Unnamed Clip'}
        </div>
        <div className="opacity-75">
          {formatDuration(clip.durationMs)}
        </div>
      </div>

      {/* Resize handles */}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 w-2 h-full bg-black bg-opacity-50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
            title="Resize start"
          />
          <div
            className="absolute right-0 top-0 w-2 h-full bg-black bg-opacity-50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
            title="Resize end"
          />
        </>
      )}

      {/* Delete button */}
      {isSelected && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            className="p-1 bg-red-600 hover:bg-red-700 rounded text-white"
            title="Delete clip"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Disabled overlay */}
      {clip.enabled === false && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <span className="text-xs text-gray-300">DISABLED</span>
        </div>
      )}
    </div>
  );
};
