/**
 * TimeScale - Core time-to-pixel mapping for timeline viewport
 * 
 * This provides the single source of truth for converting between:
 * - Time domain (milliseconds)
 * - Pixel domain (screen coordinates)
 * 
 * Key concepts:
 * - msPerPx: zoom factor (lower = more zoomed in)
 * - viewStartMs: absolute timeline time at left edge of content area
 * - contentOffsetPx: fixed left offset to clear labels column
 */

export interface TimeScaleConfig {
  msPerPx: number;           // Time per pixel (zoom factor)
  viewStartMs: number;       // Timeline time at left edge of content
  contentOffsetPx: number;   // Fixed offset for labels column
}

export class TimeScale {
  public readonly msPerPx: number;
  public readonly viewStartMs: number;
  public readonly contentOffsetPx: number;

  constructor(config: TimeScaleConfig) {
    this.msPerPx = Math.max(0.1, config.msPerPx); // Prevent division by zero
    this.viewStartMs = config.viewStartMs;
    this.contentOffsetPx = config.contentOffsetPx;
  }

  /**
   * Convert timeline time to screen X coordinate
   * @param timeMs Timeline time in milliseconds
   * @returns X coordinate in pixels
   */
  xOf(timeMs: number): number {
    return this.contentOffsetPx + (timeMs - this.viewStartMs) / this.msPerPx;
  }

  /**
   * Convert screen X coordinate to timeline time
   * @param xPx X coordinate in pixels
   * @returns Timeline time in milliseconds
   */
  tOf(xPx: number): number {
    return this.viewStartMs + (xPx - this.contentOffsetPx) * this.msPerPx;
  }

  /**
   * Get the end time of the current viewport
   * @param viewportWidthPx Width of the viewport in pixels
   * @returns End time in milliseconds
   */
  viewEndMs(viewportWidthPx: number): number {
    return this.viewStartMs + viewportWidthPx * this.msPerPx;
  }

  /**
   * Get the visible time range
   * @param viewportWidthPx Width of the viewport in pixels
   * @returns [startMs, endMs]
   */
  getVisibleRange(viewportWidthPx: number): [number, number] {
    return [this.viewStartMs, this.viewEndMs(viewportWidthPx)];
  }

  /**
   * Create a new TimeScale with updated zoom, anchored at a specific point
   * @param nextMsPerPx New zoom level
   * @param anchorPx X coordinate to keep stable during zoom
   * @returns New TimeScale instance
   */
  setZoom(nextMsPerPx: number, anchorPx: number): TimeScale {
    const tAtAnchor = this.tOf(anchorPx);
    const newViewStartMs = tAtAnchor - (anchorPx - this.contentOffsetPx) * nextMsPerPx;
    
    return new TimeScale({
      msPerPx: nextMsPerPx,
      viewStartMs: newViewStartMs,
      contentOffsetPx: this.contentOffsetPx
    });
  }

  /**
   * Create a new TimeScale panned by pixels
   * @param dxPx Number of pixels to pan (positive = pan right)
   * @returns New TimeScale instance
   */
  panByPixels(dxPx: number): TimeScale {
    return new TimeScale({
      msPerPx: this.msPerPx,
      viewStartMs: this.viewStartMs + dxPx * this.msPerPx,
      contentOffsetPx: this.contentOffsetPx
    });
  }

  /**
   * Create a new TimeScale panned by time
   * @param dtMs Time to pan in milliseconds (positive = pan right)
   * @returns New TimeScale instance
   */
  panByTime(dtMs: number): TimeScale {
    return new TimeScale({
      msPerPx: this.msPerPx,
      viewStartMs: this.viewStartMs + dtMs,
      contentOffsetPx: this.contentOffsetPx
    });
  }

  /**
   * Clamp a time value to be within the viewport
   * @param timeMs Time to clamp
   * @param viewportWidthPx Viewport width
   * @returns Clamped time
   */
  clampToViewport(timeMs: number, viewportWidthPx: number): number {
    const [startMs, endMs] = this.getVisibleRange(viewportWidthPx);
    return Math.max(startMs, Math.min(endMs, timeMs));
  }

  /**
   * Check if a time is visible in the current viewport
   * @param timeMs Time to check
   * @param viewportWidthPx Viewport width
   * @returns True if time is visible
   */
  isTimeVisible(timeMs: number, viewportWidthPx: number): boolean {
    const [startMs, endMs] = this.getVisibleRange(viewportWidthPx);
    return timeMs >= startMs && timeMs <= endMs;
  }

  /**
   * Get duration in pixels
   * @param durationMs Duration in milliseconds
   * @returns Duration in pixels
   */
  durationToPx(durationMs: number): number {
    return durationMs / this.msPerPx;
  }

  /**
   * Get duration in milliseconds from pixels
   * @param durationPx Duration in pixels
   * @returns Duration in milliseconds
   */
  pxToDuration(durationPx: number): number {
    return durationPx * this.msPerPx;
  }
}

/**
 * Factory function to create TimeScale with sensible defaults
 */
export function createTimeScale(
  msPerPx: number = 100,
  viewStartMs: number = 0,
  contentOffsetPx: number = 220
): TimeScale {
  return new TimeScale({ msPerPx, viewStartMs, contentOffsetPx });
}

/**
 * Predefined zoom levels for smooth zooming experience
 * Each level roughly doubles/halves the zoom
 */
export const ZOOM_LEVELS = [
  5,     // Very zoomed in (5ms per pixel)
  10,    // Zoomed in
  20,    // Moderately zoomed in
  50,    // Normal
  100,   // Default
  200,   // Zoomed out
  500,   // More zoomed out
  1000,  // Very zoomed out
  2000,  // Extremely zoomed out
  5000   // Overview
] as const;

/**
 * Get the closest zoom level to a given msPerPx value
 */
export function getClosestZoomLevel(msPerPx: number): number {
  return ZOOM_LEVELS.reduce((closest, level) => 
    Math.abs(level - msPerPx) < Math.abs(closest - msPerPx) ? level : closest
  );
}

/**
 * Get nice time intervals for ruler ticks based on zoom level
 */
export function getTickInterval(msPerPx: number): number {
  // Target: 50-100 pixels between major ticks
  const targetPx = 75;
  const baseInterval = msPerPx * targetPx;
  
  // Round to nice intervals
  const niceIntervals = [
    100,     // 0.1 second
    250,     // 0.25 second
    500,     // 0.5 second
    1000,    // 1 second
    2000,    // 2 seconds
    5000,    // 5 seconds
    10000,   // 10 seconds
    15000,   // 15 seconds
    30000,   // 30 seconds
    60000,   // 1 minute
    120000,  // 2 minutes
    300000,  // 5 minutes
    600000,  // 10 minutes
    1800000, // 30 minutes
    3600000  // 1 hour
  ];
  
  return niceIntervals.find(interval => interval >= baseInterval) || niceIntervals[niceIntervals.length - 1];
}
