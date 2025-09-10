/**
 * Core data types for the timeline system
 */

export interface Track {
  id: string;
  name: string;
  kind: 'video' | 'overlay' | 'audio';
  order: number;
  color: string; // Tailwind class like 'bg-blue-600'
  isVisible: boolean;
  isMuted: boolean;
  isLocked: boolean;
}

export interface Clip {
  id: string;
  trackId: string;
  kind: 'video' | 'overlay' | 'audio';
  sourceId: string; // cameraId or asset.id
  startMs: number;
  durationMs: number;
  opacity?: number;
  enabled?: boolean;
  name?: string;
  
  // Visual properties for overlays
  scale?: number; // 0-200, default 100
  positionX?: number; // -100 to 100, default 0 (center)
  positionY?: number; // -100 to 100, default 0 (center)
  
  // Transition properties
  transitionInType?: TransitionType;
  transitionInDuration?: number; // in milliseconds, default 500
  transitionOutType?: TransitionType;
  transitionOutDuration?: number; // in milliseconds, default 500
  
  // Legacy compatibility fields
  cameraId?: string;
  camera?: any;
  asset?: any;
  
  // Additional metadata
  meta?: Record<string, any>;
}

export interface TimelineViewport {
  msPerPx: number;
  viewStartMs: number;
  contentOffsetPx: number;
  viewportWidthPx: number;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'clip' | 'playhead' | 'resize-left' | 'resize-right' | null;
  clipId?: string;
  startX: number;
  startValue: number; // startMs for clip drag, currentTimeMs for playhead
  originalStartMs?: number;
  originalDurationMs?: number;
}

export interface DropData {
  type: 'camera' | 'asset';
  cameraId?: string;
  camera?: any;
  asset?: any;
}

// Playback rates
export type PlaybackRate = 0.5 | 1 | 2;

// Transition types for overlays
export type TransitionType = 
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'scale-in'
  | 'scale-out'
  | 'zoom-in'
  | 'zoom-out';

// Zoom preset
export interface ZoomPreset {
  label: string;
  durationMs: number;
}
