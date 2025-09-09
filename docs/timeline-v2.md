# Timeline v2 Architecture Documentation

## Overview

The Timeline v2 system is a complete rewrite of VistterStudio's timeline functionality, built around a true time-domain model with proper state management, drag-and-drop interactions, and seamless preview integration.

## Core Architecture

### Time Domain Model

The timeline operates on a **time-first principle** where all positioning and scaling is calculated based on time values, not pixel dimensions.

#### TimeScale Class

The `TimeScale` class handles all time↔pixel conversions:

```typescript
class TimeScale {
  constructor(
    public msPerPx: number,        // Milliseconds per pixel
    public viewStartMs: number,    // Start time of visible area
    public contentOffsetPx: number // Width of labels column (192px)
  )
  
  xOf(timeMs: number): number     // Convert time to pixel position
  tOf(pixelX: number): number     // Convert pixel to time
  setVisibleDuration(durationMs: number, anchorPx?: number): TimeScale
  panByPixels(deltaX: number): TimeScale
}
```

**Key Benefits:**
- Consistent positioning at all zoom levels
- No CSS transform scaling hacks
- Precise time calculations
- Easy snapping and alignment

### State Management

Uses Zustand for centralized state management with the following structure:

```typescript
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
}
```

**Store Features:**
- Real-time playback engine using `requestAnimationFrame`
- Automatic state synchronization across components
- Optimized updates with selective subscriptions
- Undo/redo capability (planned)

### Component Architecture

#### Timeline (Main Container)
- Handles viewport management and scrolling
- Coordinates all child components
- Manages wheel events for zoom/pan
- Provides resize observer for responsive behavior

#### HeaderRuler
- Generates "nice" tick intervals based on zoom level
- Renders time labels at consistent font sizes
- Updates automatically when viewport changes
- Supports multiple time formats

#### Playhead
- Draggable red line indicating current time
- Keyboard navigation (←/→ for nudge, Home/End for jump)
- Smooth scrubbing with snapping
- Visual feedback during drag operations

#### TracksSurface
- Renders track headers with controls (visibility, mute, lock)
- Handles drag-and-drop from sidebar
- Manages track ordering and layout
- Provides visual drop zones

#### ClipView
- Individual clip rendering and interaction
- Drag to move, resize handles for duration editing
- Visual feedback for selection and hover states
- Context menu for clip operations (planned)

#### TimelineTransport
- Play/pause/stop controls
- Playback rate selection (0.5x, 1x, 2x)
- Zoom preset buttons
- Timecode display
- Keyboard shortcuts (Space, J/K/L)

#### PropertiesDock
- Live editing of selected clip properties
- Time values (start, duration, end)
- Visual properties (opacity, name)
- Source information display
- Clip operations (duplicate, delete)

## Data Models

### Track
```typescript
interface Track {
  id: string;
  name: string;
  kind: 'video' | 'overlay' | 'audio';
  order: number;
  color: string;        // Tailwind class
  isVisible: boolean;
  isMuted: boolean;
  isLocked: boolean;
}
```

### Clip
```typescript
interface Clip {
  id: string;
  trackId: string;
  kind: 'video' | 'overlay' | 'audio';
  sourceId: string;     // Camera ID or asset ID
  startMs: number;
  durationMs: number;
  opacity?: number;
  enabled?: boolean;
  name?: string;
  
  // Legacy compatibility
  cameraId?: string;
  camera?: any;
  asset?: any;
}
```

## Interaction System

### Drag and Drop

**From Sidebar to Timeline:**
1. Sidebar items (cameras/assets) have `draggable` attribute
2. `onDragStart` sets `dataTransfer` with JSON payload
3. Track drop zones handle `onDrop` events
4. Drop position converted to time using `timeScale.tOf()`
5. New clip created with snapped start time

**Clip Movement:**
1. `ClipView` handles `onMouseDown` on clip body
2. Global mouse events track movement
3. Position updates calculated in time domain
4. Snapping applied to grid and adjacent clips
5. Store updated with new `startMs` value

**Clip Resizing:**
1. Resize handles on left/right edges of selected clips
2. Left handle adjusts both `startMs` and `durationMs`
3. Right handle adjusts only `durationMs`
4. Minimum duration enforced (500ms)
5. Visual feedback during resize operations

### Zoom System

**Zoom Presets:**
- 30s, 1m, 2m, 5m, 10m visible duration
- Buttons in transport bar
- Maintains current playhead position when possible

**Mouse Wheel Zoom:**
- Ctrl/Cmd + wheel for zoom
- Anchored at mouse cursor position
- Smooth transitions with `requestAnimationFrame`
- Prevents browser page zoom

**Pan Navigation:**
- Horizontal scroll for timeline content
- Wheel events without modifiers
- Keyboard arrow keys for precise movement
- Automatic bounds checking (no negative time)

### Playback Engine

**Real-time Updates:**
```typescript
// Playback loop using rAF
const tick = () => {
  if (!isPlaying) return;
  
  const deltaMs = (currentTime - lastTime) * playbackRate;
  setCurrentTime(currentTimeMs + deltaMs);
  
  requestAnimationFrame(tick);
};
```

**Features:**
- Smooth 60fps playback
- Variable playback rates (0.5x, 1x, 2x)
- Automatic pause at timeline end
- Preview updates follow playhead position

## Preview Integration

### Timeline-Driven Preview

The preview window now displays the **program output** of the timeline at the current playhead position:

```typescript
const { previewContent, overlays } = useTimelinePreview(cameras, getStreamUrl);
```

**Preview Logic:**
1. Get all clips active at `currentTimeMs`
2. Find primary video content (first video track with active clip)
3. Collect overlay clips from overlay tracks
4. Return structured data for preview rendering

**Content Priority:**
1. Video tracks (cameras and video assets)
2. Overlay tracks (images and graphics)
3. Audio tracks (background audio)

**Camera Integration:**
- Supports both legacy cameras (HLS) and v4 cameras (WebRTC)
- Automatic protocol detection based on `product_model`
- Graceful fallback for offline cameras
- Thumbnail caching for quick switching

## Performance Optimizations

### Virtualization
- Only render clips within visible viewport
- Efficient culling of off-screen elements
- Lazy loading of clip thumbnails
- Debounced scroll updates

### Memory Management
- Cleanup of event listeners on unmount
- Proper disposal of video elements
- Garbage collection of unused clips
- Store subscription optimization

### Rendering Optimizations
- `requestAnimationFrame` for smooth animations
- CSS transforms for hardware acceleration
- Minimal DOM updates using React keys
- Batched state updates in Zustand

## Extension Points

### Custom Clip Types
Add new clip types by extending the `Clip` interface:

```typescript
interface CustomClip extends Clip {
  kind: 'custom';
  customData: CustomClipData;
}
```

Register custom renderers in `ClipView` component.

### Effects and Filters
Extend the preview pipeline to support real-time effects:

```typescript
interface ClipEffect {
  id: string;
  type: string;
  parameters: Record<string, any>;
}
```

### Timeline Plugins
Create timeline plugins using the store API:

```typescript
const useTimelinePlugin = (pluginConfig) => {
  const store = useTimelineStore();
  // Plugin logic here
};
```

## Migration from v1

### Data Migration
Legacy timeline data is automatically converted:

```typescript
// v1 format
{ startTime: 5, duration: 10 }  // seconds

// v2 format  
{ startMs: 5000, durationMs: 10000 }  // milliseconds
```

### API Changes
- `currentTime` → `currentTimeMs` (milliseconds)
- `elements` → `clips` (renamed for clarity)
- `type` → `kind` (standardized terminology)
- Removed prop drilling, use store hooks instead

### Component Updates
- Replace `<Timeline>` import with `import { Timeline } from './timeline'`
- Update preview logic to use `useTimelinePreview` hook
- Remove manual state management, use store actions

## Testing Strategy

### Unit Tests
- Time conversion functions (`xOf`, `tOf`)
- Tick generation algorithms
- Clip collision detection
- Snap calculations

### Integration Tests
- Drag and drop workflows
- Playback synchronization
- Preview content updates
- Keyboard shortcuts

### Performance Tests
- Timeline with 100+ clips
- Zoom/pan responsiveness
- Memory usage over time
- Playback smoothness

## Future Enhancements

### Planned Features
- Multi-track audio mixing
- Keyframe animations
- Video effects pipeline
- Export functionality
- Collaboration features

### Performance Improvements
- WebGL-accelerated rendering
- Web Workers for heavy operations
- Service Worker caching
- Progressive loading

### Developer Experience
- Timeline component library
- Plugin development kit
- Visual timeline editor
- Debug tools and profiling

---

This architecture provides a solid foundation for professional video editing capabilities while maintaining the simplicity and performance requirements of VistterStudio.
