/**
 * TimeScale Unit Tests
 * 
 * Tests for the core time-to-pixel mapping functionality
 */

import { TimeScale, createTimeScale, getClosestZoomLevel, getTickInterval } from '../TimeScale';

describe('TimeScale', () => {
  const defaultConfig = {
    msPerPx: 100,
    viewStartMs: 0,
    contentOffsetPx: 220
  };

  describe('Basic time-pixel conversion', () => {
    test('xOf converts time to pixel coordinate', () => {
      const timeScale = new TimeScale(defaultConfig);
      
      expect(timeScale.xOf(0)).toBe(220); // contentOffsetPx
      expect(timeScale.xOf(1000)).toBe(230); // 220 + 1000/100
      expect(timeScale.xOf(5000)).toBe(270); // 220 + 5000/100
    });

    test('tOf converts pixel coordinate to time', () => {
      const timeScale = new TimeScale(defaultConfig);
      
      expect(timeScale.tOf(220)).toBe(0); // contentOffsetPx
      expect(timeScale.tOf(230)).toBe(1000); // (230-220) * 100
      expect(timeScale.tOf(270)).toBe(5000); // (270-220) * 100
    });

    test('xOf and tOf are inverse operations', () => {
      const timeScale = new TimeScale(defaultConfig);
      
      const testTimes = [0, 1000, 5000, 10000, 30000];
      testTimes.forEach(timeMs => {
        const x = timeScale.xOf(timeMs);
        const recoveredTime = timeScale.tOf(x);
        expect(recoveredTime).toBeCloseTo(timeMs, 1);
      });
      
      const testPixels = [220, 250, 300, 400, 500];
      testPixels.forEach(xPx => {
        const time = timeScale.tOf(xPx);
        const recoveredX = timeScale.xOf(time);
        expect(recoveredX).toBeCloseTo(xPx, 1);
      });
    });
  });

  describe('Zoom operations', () => {
    test('setZoom maintains anchor point', () => {
      const timeScale = new TimeScale(defaultConfig);
      const anchorPx = 320; // Some point in the viewport
      const anchorTime = timeScale.tOf(anchorPx);
      
      const zoomedScale = timeScale.setZoom(50, anchorPx); // Zoom in 2x
      const newAnchorTime = zoomedScale.tOf(anchorPx);
      
      expect(newAnchorTime).toBeCloseTo(anchorTime, 1);
      expect(zoomedScale.msPerPx).toBe(50);
    });

    test('setZoom with different anchor points', () => {
      const timeScale = new TimeScale({ ...defaultConfig, viewStartMs: 5000 });
      
      // Test anchoring at left edge of content
      const leftAnchor = 220;
      const leftTime = timeScale.tOf(leftAnchor);
      const leftZoomed = timeScale.setZoom(50, leftAnchor);
      expect(leftZoomed.tOf(leftAnchor)).toBeCloseTo(leftTime, 1);
      
      // Test anchoring at center
      const centerAnchor = 420;
      const centerTime = timeScale.tOf(centerAnchor);
      const centerZoomed = timeScale.setZoom(50, centerAnchor);
      expect(centerZoomed.tOf(centerAnchor)).toBeCloseTo(centerTime, 1);
    });
  });

  describe('Pan operations', () => {
    test('panByPixels updates viewStartMs correctly', () => {
      const timeScale = new TimeScale(defaultConfig);
      const panDistance = 50;
      
      const pannedScale = timeScale.panByPixels(panDistance);
      
      expect(pannedScale.viewStartMs).toBe(panDistance * defaultConfig.msPerPx);
      expect(pannedScale.msPerPx).toBe(defaultConfig.msPerPx);
      expect(pannedScale.contentOffsetPx).toBe(defaultConfig.contentOffsetPx);
    });

    test('panByTime updates viewStartMs correctly', () => {
      const timeScale = new TimeScale(defaultConfig);
      const panTime = 2000;
      
      const pannedScale = timeScale.panByTime(panTime);
      
      expect(pannedScale.viewStartMs).toBe(panTime);
      expect(pannedScale.msPerPx).toBe(defaultConfig.msPerPx);
      expect(pannedScale.contentOffsetPx).toBe(defaultConfig.contentOffsetPx);
    });
  });

  describe('Viewport calculations', () => {
    test('viewEndMs calculates correctly', () => {
      const timeScale = new TimeScale({ ...defaultConfig, viewStartMs: 1000 });
      const viewportWidth = 800;
      
      const endMs = timeScale.viewEndMs(viewportWidth);
      const expectedEnd = 1000 + 800 * 100; // viewStart + width * msPerPx
      
      expect(endMs).toBe(expectedEnd);
    });

    test('getVisibleRange returns correct range', () => {
      const timeScale = new TimeScale({ ...defaultConfig, viewStartMs: 2000 });
      const viewportWidth = 600;
      
      const [startMs, endMs] = timeScale.getVisibleRange(viewportWidth);
      
      expect(startMs).toBe(2000);
      expect(endMs).toBe(2000 + 600 * 100);
    });

    test('isTimeVisible correctly identifies visible times', () => {
      const timeScale = new TimeScale({ ...defaultConfig, viewStartMs: 1000 });
      const viewportWidth = 400; // 400px * 100ms/px = 40000ms range
      
      expect(timeScale.isTimeVisible(500, viewportWidth)).toBe(false); // Before start
      expect(timeScale.isTimeVisible(1000, viewportWidth)).toBe(true); // At start
      expect(timeScale.isTimeVisible(20000, viewportWidth)).toBe(true); // In middle
      expect(timeScale.isTimeVisible(41000, viewportWidth)).toBe(true); // At end
      expect(timeScale.isTimeVisible(42000, viewportWidth)).toBe(false); // After end
    });
  });

  describe('Duration conversions', () => {
    test('durationToPx converts duration to pixels', () => {
      const timeScale = new TimeScale(defaultConfig);
      
      expect(timeScale.durationToPx(1000)).toBe(10); // 1000ms / 100ms/px
      expect(timeScale.durationToPx(5000)).toBe(50);
      expect(timeScale.durationToPx(10000)).toBe(100);
    });

    test('pxToDuration converts pixels to duration', () => {
      const timeScale = new TimeScale(defaultConfig);
      
      expect(timeScale.pxToDuration(10)).toBe(1000); // 10px * 100ms/px
      expect(timeScale.pxToDuration(50)).toBe(5000);
      expect(timeScale.pxToDuration(100)).toBe(10000);
    });
  });

  describe('Edge cases', () => {
    test('prevents division by zero with minimum msPerPx', () => {
      const timeScale = new TimeScale({ ...defaultConfig, msPerPx: 0 });
      expect(timeScale.msPerPx).toBe(0.1); // Should be clamped to minimum
    });

    test('handles negative times', () => {
      const timeScale = new TimeScale({ ...defaultConfig, viewStartMs: -1000 });
      
      expect(timeScale.xOf(-1000)).toBe(220);
      expect(timeScale.xOf(0)).toBe(230);
      expect(timeScale.tOf(220)).toBe(-1000);
    });
  });
});

describe('Utility functions', () => {
  describe('getClosestZoomLevel', () => {
    test('finds closest predefined zoom level', () => {
      expect(getClosestZoomLevel(7)).toBe(5);
      expect(getClosestZoomLevel(15)).toBe(10);
      expect(getClosestZoomLevel(75)).toBe(50);
      expect(getClosestZoomLevel(150)).toBe(100);
      expect(getClosestZoomLevel(350)).toBe(500);
    });
  });

  describe('getTickInterval', () => {
    test('returns appropriate intervals for different zoom levels', () => {
      // Very zoomed in - should use small intervals
      expect(getTickInterval(5)).toBeLessThanOrEqual(1000);
      
      // Normal zoom - should use medium intervals
      expect(getTickInterval(100)).toBeGreaterThan(1000);
      expect(getTickInterval(100)).toBeLessThan(60000);
      
      // Zoomed out - should use large intervals
      expect(getTickInterval(1000)).toBeGreaterThanOrEqual(60000);
    });

    test('intervals are from predefined nice values', () => {
      const niceIntervals = [
        100, 250, 500, 1000, 2000, 5000, 10000, 15000, 30000,
        60000, 120000, 300000, 600000, 1800000, 3600000
      ];
      
      [5, 10, 50, 100, 500, 1000, 2000].forEach(msPerPx => {
        const interval = getTickInterval(msPerPx);
        expect(niceIntervals).toContain(interval);
      });
    });
  });

  describe('createTimeScale factory', () => {
    test('creates TimeScale with default values', () => {
      const timeScale = createTimeScale();
      
      expect(timeScale.msPerPx).toBe(100);
      expect(timeScale.viewStartMs).toBe(0);
      expect(timeScale.contentOffsetPx).toBe(220);
    });

    test('creates TimeScale with custom values', () => {
      const timeScale = createTimeScale(50, 1000, 300);
      
      expect(timeScale.msPerPx).toBe(50);
      expect(timeScale.viewStartMs).toBe(1000);
      expect(timeScale.contentOffsetPx).toBe(300);
    });
  });
});
