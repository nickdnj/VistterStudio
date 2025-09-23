/**
 * TimelineViewportContext - Shared viewport state for timeline components
 * 
 * This provides a centralized way to manage and access timeline viewport state
 * across all timeline components (header, tracks, playhead, zoom controls).
 */

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { TimeScale, createTimeScale, ZOOM_LEVELS, getClosestZoomLevel } from './TimeScale';

export interface TimelineViewportState {
  timeScale: TimeScale;
  currentTimeMs: number;
  totalDurationMs: number;
  viewportWidthPx: number;
  isPlaying: boolean;
}

export interface TimelineViewportActions {
  setZoom: (msPerPx: number, anchorPx?: number) => void;
  setCurrentTime: (timeMs: number) => void;
  panByPixels: (dxPx: number) => void;
  panByTime: (dtMs: number) => void;
  setPlaying: (playing: boolean) => void;
  setViewportWidth: (widthPx: number) => void;
  setTotalDuration: (durationMs: number) => void;
  zoomIn: (anchorPx?: number) => void;
  zoomOut: (anchorPx?: number) => void;
  zoomToFit: () => void;
  centerOnTime: (timeMs: number) => void;
}

export interface TimelineViewportContextValue {
  state: TimelineViewportState;
  actions: TimelineViewportActions;
}

const TimelineViewportContext = createContext<TimelineViewportContextValue | null>(null);

export interface TimelineViewportProviderProps {
  children: React.ReactNode;
  initialMsPerPx?: number;
  initialCurrentTime?: number;
  totalDuration?: number;
  contentOffsetPx?: number;
}

export function TimelineViewportProvider({
  children,
  initialMsPerPx = 100,
  initialCurrentTime = 0,
  totalDuration = 300000, // 5 minutes default
  contentOffsetPx = 220
}: TimelineViewportProviderProps) {
  const [timeScale, setTimeScale] = useState(() => 
    createTimeScale(initialMsPerPx, 0, contentOffsetPx)
  );
  const [currentTimeMs, setCurrentTimeMs] = useState(initialCurrentTime);
  const [totalDurationMs, setTotalDurationMs] = useState(totalDuration);
  const [viewportWidthPx, setViewportWidthPx] = useState(1000);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Ref for smooth animations
  const animationFrameRef = useRef<number>();

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const setZoom = useCallback((msPerPx: number, anchorPx?: number) => {
    const anchor = anchorPx ?? viewportWidthPx / 2; // Default to viewport center
    setTimeScale(current => current.setZoom(msPerPx, anchor));
  }, [viewportWidthPx]);

  const setCurrentTime = useCallback((timeMs: number) => {
    const clampedTime = Math.max(0, Math.min(totalDurationMs, timeMs));
    setCurrentTimeMs(clampedTime);
  }, [totalDurationMs]);

  const panByPixels = useCallback((dxPx: number) => {
    setTimeScale(current => current.panByPixels(dxPx));
  }, []);

  const panByTime = useCallback((dtMs: number) => {
    setTimeScale(current => current.panByTime(dtMs));
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const zoomIn = useCallback((anchorPx?: number) => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level >= timeScale.msPerPx);
    const nextIndex = Math.max(0, currentIndex - 1);
    const nextMsPerPx = ZOOM_LEVELS[nextIndex];
    if (nextMsPerPx !== timeScale.msPerPx) {
      setZoom(nextMsPerPx, anchorPx);
    }
  }, [timeScale.msPerPx, setZoom]);

  const zoomOut = useCallback((anchorPx?: number) => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level >= timeScale.msPerPx);
    const nextIndex = Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1);
    const nextMsPerPx = ZOOM_LEVELS[nextIndex];
    if (nextMsPerPx !== timeScale.msPerPx) {
      setZoom(nextMsPerPx, anchorPx);
    }
  }, [timeScale.msPerPx, setZoom]);

  const zoomToFit = useCallback(() => {
    if (totalDurationMs > 0 && viewportWidthPx > 0) {
      const contentWidth = viewportWidthPx - contentOffsetPx;
      const msPerPx = totalDurationMs / contentWidth;
      const closestZoom = getClosestZoomLevel(msPerPx);
      setTimeScale(createTimeScale(closestZoom, 0, contentOffsetPx));
    }
  }, [totalDurationMs, viewportWidthPx, contentOffsetPx]);

  const centerOnTime = useCallback((timeMs: number) => {
    const centerPx = viewportWidthPx / 2;
    const newViewStartMs = timeMs - (centerPx - contentOffsetPx) * timeScale.msPerPx;
    setTimeScale(new TimeScale({
      msPerPx: timeScale.msPerPx,
      viewStartMs: newViewStartMs,
      contentOffsetPx: timeScale.contentOffsetPx
    }));
  }, [timeScale, viewportWidthPx, contentOffsetPx]);

  const state: TimelineViewportState = {
    timeScale,
    currentTimeMs,
    totalDurationMs,
    viewportWidthPx,
    isPlaying
  };

  const actions: TimelineViewportActions = {
    setZoom,
    setCurrentTime,
    panByPixels,
    panByTime,
    setPlaying,
    setViewportWidth: setViewportWidthPx,
    setTotalDuration: setTotalDurationMs,
    zoomIn,
    zoomOut,
    zoomToFit,
    centerOnTime
  };

  return (
    <TimelineViewportContext.Provider value={{ state, actions }}>
      {children}
    </TimelineViewportContext.Provider>
  );
}

/**
 * Hook to access timeline viewport state and actions
 */
export function useTimelineViewport(): TimelineViewportContextValue {
  const context = useContext(TimelineViewportContext);
  if (!context) {
    throw new Error('useTimelineViewport must be used within a TimelineViewportProvider');
  }
  return context;
}

/**
 * Convenience hooks for specific parts of the context
 */
export function useTimeScale(): TimeScale {
  const { state } = useTimelineViewport();
  return state.timeScale;
}

export function useCurrentTime(): [number, (time: number) => void] {
  const { state, actions } = useTimelineViewport();
  return [state.currentTimeMs, actions.setCurrentTime];
}

export function usePlaybackState(): [boolean, (playing: boolean) => void] {
  const { state, actions } = useTimelineViewport();
  return [state.isPlaying, actions.setPlaying];
}

export function useZoomControls() {
  const { state, actions } = useTimelineViewport();
  return {
    msPerPx: state.timeScale.msPerPx,
    setZoom: actions.setZoom,
    zoomIn: actions.zoomIn,
    zoomOut: actions.zoomOut,
    zoomToFit: actions.zoomToFit
  };
}
