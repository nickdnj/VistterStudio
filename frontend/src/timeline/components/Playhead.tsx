import React, { useCallback, useEffect, useRef } from 'react';
import { useTimelineStore } from '../state/store';

interface PlayheadProps {
  height: number;
  className?: string;
}

export const Playhead: React.FC<PlayheadProps> = ({ height, className = '' }) => {
  const { 
    currentTimeMs, 
    viewport, 
    timeScale, 
    dragState,
    setCurrentTime, 
    startDrag, 
    updateDrag, 
    endDrag,
    snapTime 
  } = useTimelineStore();

  const isDragging = dragState.isDragging && dragState.dragType === 'playhead';
  const playheadRef = useRef<HTMLDivElement>(null);

  // Calculate playhead position
  const playheadX = timeScale.xOf(currentTimeMs);

  // Handle mouse down on playhead
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    startDrag({
      dragType: 'playhead',
      startX: e.clientX,
      startValue: currentTimeMs,
    });
  }, [currentTimeMs, startDrag]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    const newTimeMs = Math.max(0, dragState.startValue + deltaX * viewport.msPerPx);
    const snappedTimeMs = snapTime(newTimeMs);
    
    setCurrentTime(snappedTimeMs);
  }, [isDragging, dragState.startX, dragState.startValue, viewport.msPerPx, snapTime, setCurrentTime]);

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
      document.body.style.cursor = 'ew-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          const leftDelta = e.shiftKey ? 5000 : 1000; // 5s or 1s
          setCurrentTime(Math.max(0, currentTimeMs - leftDelta));
          break;
        case 'ArrowRight':
          e.preventDefault();
          const rightDelta = e.shiftKey ? 5000 : 1000; // 5s or 1s
          setCurrentTime(currentTimeMs + rightDelta);
          break;
        case 'Home':
          e.preventDefault();
          setCurrentTime(0);
          break;
        case 'End':
          e.preventDefault();
          // Jump to end of timeline (could be calculated from clips)
          setCurrentTime(10 * 60 * 1000); // 10 minutes for now
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTimeMs, setCurrentTime]);

  // Don't render if playhead is outside visible area
  if (playheadX < viewport.contentOffsetPx - 10 || playheadX > viewport.contentOffsetPx + viewport.viewportWidthPx + 10) {
    return null;
  }

  return (
    <div className={`absolute top-0 pointer-events-none ${className}`} style={{ height }}>
      {/* Playhead line */}
      <div
        className="absolute top-0 w-px bg-red-500 pointer-events-none z-20"
        style={{
          left: playheadX,
          height,
          transform: 'translateX(-50%)',
        }}
      />
      
      {/* Playhead handle */}
      <div
        ref={playheadRef}
        className={`
          absolute top-0 w-3 h-4 bg-red-500 border border-red-600 rounded-sm 
          cursor-ew-resize pointer-events-auto z-30 shadow-sm
          ${isDragging ? 'bg-red-400 shadow-md' : 'hover:bg-red-400'}
          transition-colors duration-150
        `}
        style={{
          left: playheadX,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={handleMouseDown}
        title={`Playhead: ${Math.floor(currentTimeMs / 1000)}s`}
      >
        {/* Handle grip */}
        <div className="absolute inset-x-0 top-1 bottom-1 flex items-center justify-center">
          <div className="w-px h-2 bg-red-800 opacity-60" />
        </div>
      </div>
      
      {/* Timecode tooltip during drag */}
      {isDragging && (
        <div
          className="absolute -top-8 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded pointer-events-none z-40"
          style={{
            left: playheadX,
            transform: 'translateX(-50%)',
          }}
        >
          {Math.floor(currentTimeMs / 1000)}s
        </div>
      )}
    </div>
  );
};
