/**
 * Playhead - Mathematically aligned playhead line and handle
 * 
 * This component provides a draggable playhead that maintains perfect alignment
 * between the ruler and tracks using the TimeScale coordinate system.
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTimelineViewport } from '../../timeline/viewport/TimelineViewportContext';

interface PlayheadProps {
  className?: string;
  onScrub?: (timeMs: number) => void;
}

export default function Playhead({ className = '', onScrub }: PlayheadProps) {
  const { state, actions } = useTimelineViewport();
  const { timeScale, currentTimeMs, totalDurationMs, isPlaying } = state;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const playheadRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Calculate playhead position
  const playheadX = timeScale.xOf(currentTimeMs);

  // Handle mouse/touch events with rAF throttling
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!isDragging) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule update on next frame
    animationFrameRef.current = requestAnimationFrame(() => {
      const deltaX = event.clientX - dragStartX;
      const deltaTime = timeScale.pxToDuration(deltaX);
      const newTime = Math.max(0, Math.min(totalDurationMs, dragStartTime + deltaTime));
      
      actions.setCurrentTime(newTime);
      onScrub?.(newTime);
    });
  }, [isDragging, dragStartX, dragStartTime, timeScale, totalDurationMs, actions, onScrub]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Cleanup animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setDragStartX(event.clientX);
    setDragStartTime(currentTimeMs);
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    
    // Capture pointer for smooth dragging
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [currentTimeMs]);

  // Setup global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle click-to-seek in ruler area
  const handleRulerClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickTime = timeScale.tOf(clickX);
      const clampedTime = Math.max(0, Math.min(totalDurationMs, clickTime));
      actions.setCurrentTime(clampedTime);
    }
  }, [timeScale, totalDurationMs, actions]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={playheadRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 100 }}
    >
      {/* Click area for seeking */}
      <div 
        className="absolute inset-0 pointer-events-auto cursor-crosshair"
        onClick={handleRulerClick}
      />
      
      {/* Playhead Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg pointer-events-none"
        style={{ 
          left: `${playheadX}px`,
          opacity: isDragging ? 1 : 0.9
        }}
      />
      
      {/* Draggable Handle */}
      <div
        className={`absolute w-4 h-4 bg-red-500 border-2 border-white rounded-sm shadow-md cursor-ew-resize pointer-events-auto transition-transform ${
          isDragging ? 'scale-110' : 'hover:scale-105'
        }`}
        style={{
          left: `${playheadX}px`,
          top: '2px',
          transform: 'translateX(-50%)',
          zIndex: 101
        }}
        onPointerDown={handlePointerDown}
        title={`Playhead: ${formatTime(currentTimeMs)}`}
      />
      
      {/* Time Display (appears during drag) */}
      {isDragging && (
        <div
          className="absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            left: `${playheadX}px`,
            top: '-32px',
            transform: 'translateX(-50%)'
          }}
        >
          {formatTime(currentTimeMs)}
        </div>
      )}
      
      {/* Playback Indicator */}
      {isPlaying && (
        <div
          className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse pointer-events-none"
          style={{
            left: `${playheadX}px`,
            top: '-6px',
            transform: 'translateX(-50%)'
          }}
        />
      )}
    </div>
  );
}
