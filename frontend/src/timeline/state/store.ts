import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { Track, Clip, TimelineViewport, DragState, PlaybackRate } from '../models/types';
import { TimeScale } from '../models/TimeScale';

interface TimelineState {
  // Time domain
  currentTimeMs: number;
  isPlaying: boolean;
  playbackRate: PlaybackRate;
  
  // Viewport
  viewport: TimelineViewport;
  timeScale: TimeScale;
  
  // Content
  tracks: Track[];
  clips: Clip[];
  selectedClipId: string | null;
  
  // Interaction state
  dragState: DragState;
  
  // History state for undo/redo
  history: {
    past: Array<{ tracks: Track[]; clips: Clip[] }>;
    present: { tracks: Track[]; clips: Clip[] };
    future: Array<{ tracks: Track[]; clips: Clip[] }>;
  };
  
  // Actions
  setCurrentTime: (timeMs: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  
  // Viewport actions
  setViewport: (viewport: Partial<TimelineViewport>) => void;
  setZoom: (durationMs: number, anchorPx?: number) => void;
  panView: (deltaX: number) => void;
  
  // Content actions
  addTrack: (track: Omit<Track, 'id' | 'order'>) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  
  addClip: (clip: Omit<Clip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  selectClip: (clipId: string | null) => void;
  
  // Drag actions
  startDrag: (dragState: Partial<DragState>) => void;
  updateDrag: (updates: Partial<DragState>) => void;
  endDrag: () => void;
  
  // Utility actions
  snapTime: (timeMs: number, snapIntervalMs?: number) => number;
  getClipsAtTime: (timeMs: number) => Clip[];
  getActiveClips: () => Clip[];
  
  // Timeline management actions
  clearTimeline: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// Default viewport settings
const DEFAULT_VIEWPORT: TimelineViewport = {
  msPerPx: 100, // 100ms per pixel = 10s per 100px
  viewStartMs: 0,
  contentOffsetPx: 192, // w-48 equivalent
  viewportWidthPx: 800, // Will be updated by component
};

// Convert legacy track data
const createDefaultTracks = (): Track[] => [
  {
    id: 'main',
    name: 'Main Track',
    kind: 'video',
    order: 0,
    color: 'bg-blue-600',
    isVisible: true,
    isMuted: false,
    isLocked: false,
  },
  {
    id: 'overlay1',
    name: 'Overlay 1',
    kind: 'overlay',
    order: 1,
    color: 'bg-green-600',
    isVisible: true,
    isMuted: false,
    isLocked: false,
  },
  {
    id: 'overlay2',
    name: 'Overlay 2',
    kind: 'overlay',
    order: 2,
    color: 'bg-purple-600',
    isVisible: true,
    isMuted: false,
    isLocked: false,
  },
  {
    id: 'audio',
    name: 'Audio',
    kind: 'audio',
    order: 3,
    color: 'bg-orange-600',
    isVisible: true,
    isMuted: false,
    isLocked: false,
  },
];

// Helper functions for history management
const createHistorySnapshot = (tracks: Track[], clips: Clip[]) => ({
  tracks: JSON.parse(JSON.stringify(tracks)),
  clips: JSON.parse(JSON.stringify(clips)),
});

const MAX_HISTORY_SIZE = 50;

// Helper function to save current state to history
const saveToHistory = (set: any, get: any) => {
  const { tracks, clips, history } = get();
  const newSnapshot = createHistorySnapshot(tracks, clips);
  
  // Don't save if the state hasn't actually changed
  const currentSnapshot = history.present;
  if (JSON.stringify(newSnapshot) === JSON.stringify(currentSnapshot)) {
    return;
  }
  
  const newPast = [...history.past, currentSnapshot];
  
  // Limit history size
  if (newPast.length > MAX_HISTORY_SIZE) {
    newPast.shift();
  }
  
  set({
    history: {
      past: newPast,
      present: newSnapshot,
      future: [], // Clear future when new action is performed
    },
  });
};

export const useTimelineStore = create<TimelineState>()(
  persist(
    subscribeWithSelector((set, get) => ({
    // Initial state
    currentTimeMs: 0,
    isPlaying: false,
    playbackRate: 1,
    
    viewport: DEFAULT_VIEWPORT,
    timeScale: new TimeScale(DEFAULT_VIEWPORT.msPerPx, DEFAULT_VIEWPORT.viewStartMs, DEFAULT_VIEWPORT.contentOffsetPx),
    
    tracks: createDefaultTracks(),
    clips: [],
    selectedClipId: null,
    
    dragState: {
      isDragging: false,
      dragType: null,
      startX: 0,
      startValue: 0,
    },
    
    history: {
      past: [],
      present: createHistorySnapshot(createDefaultTracks(), []),
      future: [],
    },
    
    // Time actions
    setCurrentTime: (timeMs: number) => {
      set({ currentTimeMs: Math.max(0, timeMs) });
    },
    
    play: () => {
      set({ isPlaying: true });
    },
    
    pause: () => {
      set({ isPlaying: false });
    },
    
    stop: () => {
      set({ 
        isPlaying: false,
        currentTimeMs: 0,
      });
    },
    
    setPlaybackRate: (rate: PlaybackRate) => {
      set({ playbackRate: rate });
    },
    
    // Viewport actions
    setViewport: (updates: Partial<TimelineViewport>) => {
      const currentViewport = get().viewport;
      const newViewport = { ...currentViewport, ...updates };
      const newTimeScale = new TimeScale(
        newViewport.msPerPx,
        newViewport.viewStartMs,
        newViewport.contentOffsetPx
      );
      
      set({ 
        viewport: newViewport,
        timeScale: newTimeScale,
      });
    },
    
    setZoom: (durationMs: number, anchorPx?: number) => {
      const { viewport, timeScale } = get();
      const newTimeScale = timeScale.setVisibleDuration(durationMs, viewport.viewportWidthPx, anchorPx);
      const newViewport = {
        ...viewport,
        msPerPx: newTimeScale.msPerPx,
        viewStartMs: newTimeScale.viewStartMs,
      };
      
      set({
        viewport: newViewport,
        timeScale: newTimeScale,
      });
    },
    
    panView: (deltaX: number) => {
      const { viewport, timeScale } = get();
      const newTimeScale = timeScale.panByPixels(deltaX);
      const newViewport = {
        ...viewport,
        viewStartMs: newTimeScale.viewStartMs,
      };
      
      set({
        viewport: newViewport,
        timeScale: newTimeScale,
      });
    },
    
    // Track actions
    addTrack: (trackData) => {
      const { tracks } = get();
      const newTrack: Track = {
        id: `track_${Date.now()}`,
        order: tracks.length,
        isVisible: true,
        isMuted: false,
        isLocked: false,
        ...trackData,
      };
      
      set({ tracks: [...tracks, newTrack] });
    },
    
    removeTrack: (trackId: string) => {
      const { tracks, clips } = get();
      set({
        tracks: tracks.filter(t => t.id !== trackId),
        clips: clips.filter(c => c.trackId !== trackId),
      });
    },
    
    updateTrack: (trackId: string, updates: Partial<Track>) => {
      const { tracks } = get();
      set({
        tracks: tracks.map(t => 
          t.id === trackId ? { ...t, ...updates } : t
        ),
      });
    },
    
    // Clip actions
    addClip: (clipData) => {
      saveToHistory(set, get);
      const { clips } = get();
      const newClip: Clip = {
        id: `clip_${Date.now()}`,
        opacity: 100,
        scale: 100,
        positionX: 0,
        positionY: 0,
        transitionInType: 'fade',
        transitionInDuration: 500,
        transitionOutType: 'fade',
        transitionOutDuration: 500,
        enabled: true,
        ...clipData,
      };
      
      set({ clips: [...clips, newClip] });
    },
    
    removeClip: (clipId: string) => {
      saveToHistory(set, get);
      const { clips } = get();
      set({ 
        clips: clips.filter(c => c.id !== clipId),
        selectedClipId: get().selectedClipId === clipId ? null : get().selectedClipId,
      });
    },
    
    updateClip: (clipId: string, updates: Partial<Clip>) => {
      const { clips } = get();
      set({
        clips: clips.map(c => 
          c.id === clipId ? { ...c, ...updates } : c
        ),
      });
    },
    
    selectClip: (clipId: string | null) => {
      set({ selectedClipId: clipId });
    },
    
    // Drag actions
    startDrag: (dragState: Partial<DragState>) => {
      set({
        dragState: {
          isDragging: true,
          dragType: null,
          startX: 0,
          startValue: 0,
          ...dragState,
        },
      });
    },
    
    updateDrag: (updates: Partial<DragState>) => {
      const { dragState } = get();
      set({
        dragState: { ...dragState, ...updates },
      });
    },
    
    endDrag: () => {
      set({
        dragState: {
          isDragging: false,
          dragType: null,
          startX: 0,
          startValue: 0,
        },
      });
    },
    
    // Utility actions
    snapTime: (timeMs: number, snapIntervalMs: number = 500) => {
      const { timeScale } = get();
      return timeScale.snapTime(timeMs, snapIntervalMs);
    },
    
    getClipsAtTime: (timeMs: number) => {
      const { clips } = get();
      return clips.filter(clip => 
        timeMs >= clip.startMs && 
        timeMs < clip.startMs + clip.durationMs &&
        clip.enabled !== false
      );
    },
    
    getActiveClips: () => {
      const { currentTimeMs } = get();
      return get().getClipsAtTime(currentTimeMs);
    },
    
    // Timeline management actions
    clearTimeline: () => {
      saveToHistory(set, get);
      set({
        clips: [],
        selectedClipId: null,
      });
    },
    
    undo: () => {
      const { history } = get();
      if (history.past.length === 0) return;
      
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, history.past.length - 1);
      
      set({
        tracks: previous.tracks,
        clips: previous.clips,
        selectedClipId: null,
        history: {
          past: newPast,
          present: previous,
          future: [history.present, ...history.future],
        },
      });
    },
    
    redo: () => {
      const { history } = get();
      if (history.future.length === 0) return;
      
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      
      set({
        tracks: next.tracks,
        clips: next.clips,
        selectedClipId: null,
        history: {
          past: [...history.past, history.present],
          present: next,
          future: newFuture,
        },
      });
    },
    
    canUndo: () => {
      const { history } = get();
      return history.past.length > 0;
    },
    
    canRedo: () => {
      const { history } = get();
      return history.future.length > 0;
    },
    })),
    {
      name: 'timeline-storage',
      partialize: (state) => ({
        tracks: state.tracks,
        clips: state.clips,
        history: state.history,
      }),
    }
  )
);

// Playback engine - updates currentTimeMs when playing
let playbackInterval: number | null = null;

// Subscribe to isPlaying changes to start/stop playback
useTimelineStore.subscribe(
  (state) => state.isPlaying,
  (isPlaying) => {
    if (isPlaying) {
      let lastTime = performance.now();
      
      const tick = () => {
        if (!useTimelineStore.getState().isPlaying) {
          return;
        }
        
        const currentTime = performance.now();
        const deltaMs = (currentTime - lastTime) * useTimelineStore.getState().playbackRate;
        lastTime = currentTime;
        
        useTimelineStore.getState().setCurrentTime(
          useTimelineStore.getState().currentTimeMs + deltaMs
        );
        
        requestAnimationFrame(tick);
      };
      
      requestAnimationFrame(tick);
    }
  }
);
