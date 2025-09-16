import React, { useCallback, useEffect } from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import { useTimelineStore } from '../state/store';
import { EffectClip } from '../models/types';

interface EffectClipViewProps {
  effectClip: EffectClip;
  className?: string;
}

export const EffectClipView: React.FC<EffectClipViewProps> = ({ 
  effectClip, 
  className = '' 
}) => {
  const {
    viewport,
    timeScale,
    selectedEffectClipId,
    dragState,
    effectAssets,
    selectEffectClip,
    updateEffectClip,
    removeEffectClip,
    startDrag,
    endDrag,
    snapTime,
  } = useTimelineStore();

  const isSelected = selectedEffectClipId === effectClip.id;
  const isDragging = dragState.isDragging && dragState.clipId === effectClip.id;

  // Get effect asset info
  const effectAsset = effectAssets.find(asset => asset.id === effectClip.effectAssetId);

  // Calculate clip position and size (relative to content area)
  const leftPx = (effectClip.startMs - viewport.viewStartMs) / viewport.msPerPx;
  const widthPx = Math.max(20, effectClip.durationMs / viewport.msPerPx);

  // Handle clip selection
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectEffectClip(effectClip.id);
  }, [effectClip.id, selectEffectClip]);

  // Handle clip drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    selectEffectClip(effectClip.id);
    
    startDrag({
      dragType: 'clip',
      clipId: effectClip.id,
      startX: e.clientX,
      startValue: effectClip.startMs,
      originalStartMs: effectClip.startMs,
      originalDurationMs: effectClip.durationMs,
    });
  }, [effectClip.id, effectClip.startMs, effectClip.durationMs, selectEffectClip, startDrag]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    selectEffectClip(effectClip.id);
    
    startDrag({
      dragType: side === 'left' ? 'resize-left' : 'resize-right',
      clipId: effectClip.id,
      startX: e.clientX,
      startValue: side === 'left' ? effectClip.startMs : effectClip.durationMs,
      originalStartMs: effectClip.startMs,
      originalDurationMs: effectClip.durationMs,
    });
  }, [effectClip.id, effectClip.startMs, effectClip.durationMs, selectEffectClip, startDrag]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaTime = deltaX * viewport.msPerPx;

    switch (dragState.dragType) {
      case 'clip': {
        const newStartMs = Math.max(0, dragState.originalStartMs! + deltaTime);
        const snappedStartMs = snapTime(newStartMs);
        updateEffectClip(effectClip.id, { startMs: snappedStartMs });
        break;
      }
      case 'resize-left': {
        const newStartMs = Math.max(0, dragState.originalStartMs! + deltaTime);
        const newDurationMs = Math.max(500, dragState.originalDurationMs! - deltaTime);
        const snappedStartMs = snapTime(newStartMs);
        const adjustedDurationMs = dragState.originalStartMs! + dragState.originalDurationMs! - snappedStartMs;
        
        if (adjustedDurationMs >= 500) {
          updateEffectClip(effectClip.id, { 
            startMs: snappedStartMs, 
            durationMs: adjustedDurationMs 
          });
        }
        break;
      }
      case 'resize-right': {
        const newDurationMs = Math.max(500, dragState.originalDurationMs! + deltaTime);
        const snappedEndMs = snapTime(effectClip.startMs + newDurationMs);
        const adjustedDurationMs = snappedEndMs - effectClip.startMs;
        
        if (adjustedDurationMs >= 500) {
          updateEffectClip(effectClip.id, { durationMs: adjustedDurationMs });
        }
        break;
      }
    }
  }, [isDragging, dragState, viewport.msPerPx, effectClip.id, effectClip.startMs, snapTime, updateEffectClip]);

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
    removeEffectClip(effectClip.id);
  }, [effectClip.id, removeEffectClip]);

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
        absolute top-1 h-12 rounded border cursor-move overflow-hidden group
        bg-purple-500 border-purple-600
        ${effectClip.enabled === false ? 'opacity-50' : ''}
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
      {/* Effect clip content */}
      <div className="p-2 h-full flex flex-col justify-between text-white text-xs">
        <div className="flex items-center space-x-1">
          <Sparkles className="h-3 w-3 text-yellow-300 flex-shrink-0" />
          <div className="font-medium truncate">
            {effectClip.name || effectAsset?.name || 'Effect'}
          </div>
        </div>
        <div className="opacity-75">
          {formatDuration(effectClip.durationMs)}
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
            title="Delete effect clip"
          >
            <Trash2 className="h-2 w-2" />
          </button>
        </div>
      )}

      {/* Disabled overlay */}
      {effectClip.enabled === false && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <span className="text-xs text-gray-300">DISABLED</span>
        </div>
      )}
    </div>
  );
};
