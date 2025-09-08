# Timeline Engine Integration Documentation

## Overview

This document details the complete overhaul of VistterStudio's preview system, transforming it from a simple camera feed viewer into a professional timeline-driven "program output" renderer.

## Problem Statement

**Before:** The preview window only displayed direct camera feeds and did not reflect the timeline composition. Users could arrange clips on the timeline, but the preview remained disconnected from the timeline state.

**After:** The preview now acts as the "program output" - it renders the timeline composition in real-time, switching between camera feeds, displaying overlays, and playing back the arranged sequence.

## Architecture Changes

### 1. Timeline Engine (`TimelineEngine.jsx`)

**Purpose:** Core engine that manages timeline playback state and content calculation.

**Key Features:**
- **Automatic Playback:** Drives timeline progression using `requestAnimationFrame`
- **Content Resolution:** Determines what should be displayed at any given time
- **State Management:** Manages `currentTime`, `isPlaying`, `duration`
- **Element Switching:** Automatically switches content as timeline progresses
- **Navigation:** Provides previous/next element jumping

**API:**
```javascript
const timeline = useTimelineEngine(tracks);

// Playback controls
timeline.play();
timeline.pause();
timeline.stop();
timeline.seekTo(30); // Seek to 30 seconds

// Navigation
timeline.jumpToNext();
timeline.jumpToPrevious();

// State access
timeline.currentTime;
timeline.isPlaying;
timeline.currentContent;
timeline.currentOverlays;
timeline.currentAudio;
```

### 2. Timeline Renderer (`TimelineRenderer.jsx`)

**Purpose:** Renders the timeline composition based on Timeline Engine state.

**Key Features:**
- **Multi-Protocol Support:** Handles WebRTC (v4 cameras) and HLS (legacy cameras)
- **Asset Rendering:** Supports video files, images, and audio
- **Overlay Compositing:** Real-time overlay rendering with animations
- **Content Synchronization:** Syncs video assets to timeline position
- **Visual Feedback:** Progress indicators and element information

**Rendering Logic:**
```javascript
// Main content rendering
if (currentContent.type === 'camera') {
  // Render camera stream (WebRTC or HLS)
} else if (currentContent.type === 'asset') {
  // Render video/image asset
}

// Overlay rendering
currentOverlays.map(overlay => {
  // Render overlay with fade-in animation
  const opacity = Math.min(1, overlay.progress * 4);
});
```

### 3. Enhanced Preview Window (`PreviewWindow.jsx`)

**Purpose:** Provides the user interface for timeline preview and controls.

**New Features:**
- **Timeline Navigation:** Previous/Next element buttons
- **Enhanced Scrubber:** Direct timeline seeking
- **Element Information:** Shows current content and overlay status
- **Professional Controls:** Play, pause, stop, and navigation

## Implementation Details

### Content Resolution Algorithm

The Timeline Engine uses this algorithm to determine what content to display:

```javascript
getCurrentContent() {
  // 1. Find main video track
  const mainTrack = this.tracks.find(track => track.type === 'video');
  
  // 2. Find element at current time
  const element = mainTrack.elements.find(element => 
    this.currentTime >= element.startTime && 
    this.currentTime < element.startTime + element.duration
  );
  
  // 3. Calculate relative time within element
  return {
    ...element,
    relativeTime: this.currentTime - element.startTime,
    progress: (this.currentTime - element.startTime) / element.duration
  };
}
```

### Overlay Compositing

Overlays are rendered with sophisticated timing and visual effects:

```javascript
// Fade-in animation (first 25% of duration)
const opacity = Math.min(1, overlay.progress * 4);

// Slide-in effect
const translateY = opacity < 1 ? (1 - opacity) * 20 : 0;

// Progress bar for each overlay
<div className="bg-blue-500 h-1 rounded-full" 
     style={{ width: `${overlay.progress * 100}%` }} />
```

### Video Synchronization

Video assets are synchronized to timeline position:

```javascript
useEffect(() => {
  if (currentContent?.type === 'asset' && videoElement) {
    // Sync video time to timeline position
    if (Math.abs(videoElement.currentTime - currentContent.relativeTime) > 0.5) {
      videoElement.currentTime = currentContent.relativeTime;
    }
  }
}, [currentContent]);
```

## Integration Points

### App.jsx Changes

1. **Timeline Engine Integration:**
   ```javascript
   // Replace basic state with Timeline Engine
   const timeline = useTimelineEngine(tracks);
   
   // Update tracks when they change
   useEffect(() => {
     timeline.setTracks(tracks);
   }, [tracks, timeline]);
   ```

2. **Preview Window Props:**
   ```javascript
   <PreviewWindow
     currentTime={timeline.currentTime}
     isPlaying={timeline.isPlaying}
     setIsPlaying={(playing) => playing ? timeline.play() : timeline.pause()}
     previewContent={timeline.currentContent}
     overlays={timeline.currentOverlays}
     currentAudio={timeline.currentAudio}
     timeline={timeline}
   />
   ```

### Timeline Component Integration

The Timeline component now receives enhanced props for better integration:

```javascript
<Timeline 
  currentTime={timeline.currentTime}
  setCurrentTime={timeline.seekTo}
  duration={timeline.duration}
  isPlaying={timeline.isPlaying}
  timeline={timeline}
/>
```

## User Experience Improvements

### Sequential Playback Example

**Scenario:** User drags Marina North (1 min) → Marina South (1 min) to timeline.

**Result:**
1. Preview starts showing Marina North WebRTC stream
2. At 1:00, seamlessly switches to Marina South WebRTC stream
3. Timeline scrubber shows accurate position
4. User can seek anywhere and preview updates immediately

### Enhanced Controls

1. **Previous/Next Navigation:** Jump between timeline elements
2. **Accurate Scrubbing:** Seek to any timeline position
3. **Element Progress:** See progress within current element
4. **Overlay Status:** Visual feedback for active overlays

## Technical Benefits

### 1. Modular Architecture
- **Timeline Engine:** Can be reused for export/recording
- **Timeline Renderer:** Separate from engine for flexibility
- **Clean Separation:** Engine (logic) vs Renderer (presentation)

### 2. Performance Optimizations
- **Smart Re-rendering:** Only updates when timeline state changes
- **Content Caching:** Reuses video elements when possible
- **Efficient Scheduling:** Uses `requestAnimationFrame` for smooth playback

### 3. Extensibility
- **Export Support:** Engine can drive export processes
- **Multiple Renderers:** Different renderers for preview vs export
- **Plugin Architecture:** Easy to add new content types

## Future Enhancements

### 1. Export Integration
```javascript
// The Timeline Engine can drive export processes
const exportRenderer = new ExportRenderer(timeline);
exportRenderer.renderToFile('output.mp4');
```

### 2. Real-time Effects
```javascript
// Add real-time effects to Timeline Renderer
const effects = ['blur', 'brightness', 'contrast'];
<TimelineRenderer effects={effects} />
```

### 3. Multi-camera Compositions
```javascript
// Support picture-in-picture layouts
const layout = {
  main: 'marina-north',
  pip: 'marina-south',
  position: 'bottom-right'
};
```

## Testing Scenarios

### 1. Basic Sequential Playback
1. Add Marina North to timeline (0-60s)
2. Add Marina South to timeline (60-120s)
3. Press play - should switch cameras at 60s

### 2. Overlay Compositing
1. Add camera to main track
2. Add image to overlay track
3. Verify overlay appears with fade-in animation

### 3. Seeking and Navigation
1. Create timeline with multiple elements
2. Use previous/next buttons to jump between elements
3. Use scrubber to seek to arbitrary positions

### 4. Live Camera Integration
1. Verify v4 cameras use WebRTC endpoints
2. Verify legacy cameras use HLS endpoints
3. Confirm seamless switching between different camera types

## Alignment with PRD/UXD

This implementation fulfills **Phase 2** requirements from the Product Requirements Document:

✅ **Timeline Editing:** Professional multi-track timeline interface
✅ **Real-time Preview:** Live composition preview as "program output"
✅ **Camera Integration:** Seamless integration with Wyze camera streams
✅ **Asset Management:** Support for video/image/audio assets
✅ **Overlay Support:** Multi-layer overlay compositing
✅ **Professional Controls:** Industry-standard playback controls

The Timeline Engine provides the foundation for future export and recording capabilities outlined in Phase 3 of the roadmap.
