# Drag & Drop Analysis: Old vs New Timeline

## Testing Results

**Please test the current build and report:**

1. **New Timeline with Simplified Coordinates:**
   - Does drag & drop work now? (items stick to tracks?)
   - Check browser console for `addElementToTrack called:` logs
   - Any errors in console?

2. **Compare with Old Timeline:**
   - Does old timeline still work normally?
   - Compare console logs between old and new

## Coordinate System Analysis

### Old Timeline (Working)
```javascript
// Simple pixel-to-time conversion
const timePosition = Math.max(0, (x / zoom) / 10);
// Where:
// - x = pixels from left edge of track
// - zoom = CSS scale factor (1 = normal, 2 = 2x zoom)
// - /10 = 10 pixels per time unit
```

### New Timeline (Fixed)
```javascript
// Should use TimeScale viewport system
const dropTimeMs = timeScale.tOf(dropX);
const dropTimeSeconds = dropTimeMs / 1000;
// Where:
// - dropX = pixels from left edge of tracks content
// - timeScale.tOf() converts viewport pixels to timeline time
// - Accounts for viewport scroll position and zoom
```

## Possible Issues

### 1. Coordinate Calculation
- **OLD:** `(x / zoom) / 10` - simple linear scale
- **NEW:** `timeScale.tOf(dropX)` - viewport-aware calculation
- **Fix:** Ensure TimeScale calculation matches expected behavior

### 2. Event Handling
- **OLD:** Direct `preventDefault()` in track component  
- **NEW:** `preventDefault()` + `stopPropagation()` in wrapper
- **Status:** ✅ Both should work

### 3. State Management
- **OLD & NEW:** Both call same `addElementToTrack(trackId, element)`
- **Status:** ✅ Should be identical

### 4. Viewport Offset
- **OLD:** No viewport offset (tracks start at x=0)
- **NEW:** Tracks start after labels column (220px offset)
- **Fix:** Account for `contentOffsetPx` in calculations

## Next Steps

Based on test results:

### If Simplified Version Works:
- Issue is in TimeScale coordinate calculation
- Need to fix `timeScale.tOf()` usage
- Restore proper viewport-aware coordinates

### If Simplified Version Fails:
- Issue is in event handling or state management
- Check console for `addElementToTrack` calls
- Investigate React state update timing
- Check for event propagation issues

### If Both Fail:
- Something changed in sidebar drag setup
- Check `dataTransfer.setData()` in Sidebar.jsx
- Verify drag data format consistency
