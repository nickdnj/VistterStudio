# Timeline Viewport Debugging Guide

## Overview

This document details the root causes and fixes for issues that emerged after refactoring VistterStudio's timeline from CSS-based scaling to a mathematical time-domain viewport model.

## Issues & Root Cause Analysis

### 1. Negative Time Ruler Values

**Problem:** Timeline ruler displayed negative values (e.g., "-00:10")

**Root Cause:**
The `TimeScale` coordinate system allowed `viewStartMs` to become negative during zoom and pan operations:

```typescript
// BROKEN: setZoom could produce negative viewStartMs
setZoom(nextMsPerPx: number, anchorPx: number): TimeScale {
  const tAtAnchor = this.tOf(anchorPx);
  const newViewStartMs = tAtAnchor - (anchorPx - this.contentOffsetPx) * nextMsPerPx;
  // ❌ No clamping - could be negative!
  return new TimeScale({ viewStartMs: newViewStartMs, ... });
}
```

When zooming in near the timeline start (t=0), the anchor calculation could push `viewStartMs` below zero.

**Fix:**
Added clamping to all TimeScale methods:

```typescript
// FIXED: Clamp viewStartMs to prevent negative time
setZoom(nextMsPerPx: number, anchorPx: number): TimeScale {
  const tAtAnchor = this.tOf(anchorPx);
  const newViewStartMs = tAtAnchor - (anchorPx - this.contentOffsetPx) * nextMsPerPx;
  return new TimeScale({
    msPerPx: nextMsPerPx,
    viewStartMs: Math.max(0, newViewStartMs), // ✅ Clamp to >= 0
    contentOffsetPx: this.contentOffsetPx
  });
}
```

Applied same fix to `panByPixels()` and `panByTime()`.

**Verification:** Timeline rulers now always show times >= 00:00, regardless of zoom level or pan position.

---

### 2. Timeline Length Capped at 1 Minute

**Problem:** Timeline remained ~1 minute long instead of extending dynamically with clips

**Root Cause:**
The new timeline used a fixed external `duration` prop instead of calculating duration dynamically from track elements:

```typescript
// BROKEN: Used fixed external duration
useEffect(() => {
  const durationMs = duration * 1000; // ❌ Fixed value!
  actions.setTotalDuration(durationMs);
}, [duration, ...]);
```

The old timeline calculated duration correctly:
```javascript
// OLD WORKING CODE:
Duration: {formatTime(Math.max(...tracks.flatMap(t => t.elements.map(e => e.startTime + e.duration)), 0))}
```

**Fix:**
Added dynamic duration calculation based on furthest track element:

```typescript
// FIXED: Calculate duration from track elements
const calculateDynamicDuration = useCallback(() => {
  const furthestElementEnd = Math.max(
    ...tracks.flatMap(t => t.elements.map(e => (e.startTime + e.duration) * 1000)),
    duration * 1000, // Use external duration as minimum
    60000 // Minimum 1 minute for empty timeline
  );
  return furthestElementEnd;
}, [tracks, duration]);

useEffect(() => {
  const dynamicDurationMs = calculateDynamicDuration();
  actions.setTotalDuration(dynamicDurationMs);
}, [calculateDynamicDuration, ...]);
```

**Verification:** Timeline now expands automatically when clips are placed beyond the current duration.

---

### 3. Drag & Drop Regression

**Problem:** Camera feeds could be dragged to timeline but "snapped back" instead of staying

**Root Cause:**
Missing `event.stopPropagation()` in drop handlers allowed event bubbling, which could interfere with state updates:

```typescript
// POTENTIAL ISSUE: Missing stopPropagation
const handleDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault(); // ✅ Good
  // ❌ Missing: event.stopPropagation()
  // ... rest of drop logic
}, []);
```

**Fix:**
Added `stopPropagation()` to prevent event bubbling:

```typescript
// FIXED: Prevent event bubbling
const handleDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.stopPropagation(); // ✅ Added
  // ... rest of drop logic
}, []);
```

**Additional Investigation:**
- ✅ Drop coordinates correctly calculated with `timeScale.tOf(dropX + timeScale.contentOffsetPx)`
- ✅ Track elements positioned correctly with `timeScale.xOf(startMs) - timeScale.contentOffsetPx`
- ✅ `onAddElement(trackId, element)` properly called with correct parameters
- ✅ State management flow: TracksSurface → NewTimeline → App.jsx

**Verification:** Drag and drop now works correctly with items persisting on timeline tracks.

---

## Technical Architecture

### Coordinate System
```
Timeline Layout:
┌─────────────────┬──────────────────────────────────┐
│   Track Labels  │         Timeline Ruler          │
│     (220px)     │      (Math-based positioning)    │
├─────────────────┼──────────────────────────────────┤
│   Track Names   │        Track Elements            │
│   (Fixed)       │   (timeScale.xOf() - offset)     │
└─────────────────┴──────────────────────────────────┘
```

### Key Functions
- `timeScale.xOf(timeMs)`: Convert time to pixel coordinate
- `timeScale.tOf(xPx)`: Convert pixel coordinate to time
- `timeScale.setZoom(msPerPx, anchorPx)`: Zoom while maintaining anchor point
- `timeScale.panByPixels(dxPx)`: Pan viewport by pixel distance

### Event Flow
1. **Drag Start:** Sidebar sets `dataTransfer` with camera/asset data
2. **Drag Over:** Track sets `dropEffect = 'copy'` and visual feedback
3. **Drop:** Track calculates time position and calls `onAddElement(trackId, element)`
4. **State Update:** App.jsx updates tracks state, triggering re-render
5. **Render:** TracksSurface positions elements using `timeScale.xOf()`

## Testing Verification

### Test Cases
1. **Negative Time Prevention:**
   - Zoom in to maximum level at timeline start
   - Pan left from t=0
   - Verify ruler shows >= 00:00

2. **Dynamic Duration:**
   - Drop 10-second camera clip at t=5:00
   - Verify timeline extends to at least 5:10
   - Drop another clip at t=10:00
   - Verify timeline extends to at least 10:10

3. **Drag & Drop Persistence:**
   - Drag camera from sidebar to track
   - Verify item appears and stays on timeline
   - Verify item positioned at correct time
   - Verify playhead aligns with item boundaries

### Debug Tools
- Browser console logs drop coordinates and timing
- Development mode shows debug overlay with msPerPx, viewStartMs, etc.
- React DevTools to inspect state updates

## Migration Notes

### From Old Timeline
- ❌ Removed: CSS `transform: scale()` zoom approach
- ❌ Removed: Fixed pixel-based ruler generation
- ✅ Added: Mathematical time-domain coordinate system
- ✅ Added: Dynamic duration calculation
- ✅ Added: Proper viewport state management

### Compatibility
- ✅ All existing drag/drop functionality preserved
- ✅ Overlay and audio track handling unchanged  
- ✅ UI layout visually identical
- ✅ TimeScale model reusable for playback/export

---

*Last updated: Timeline viewport refactor completion*
