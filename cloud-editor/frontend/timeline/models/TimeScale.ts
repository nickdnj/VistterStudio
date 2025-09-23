/**
 * TimeScale - Core time-domain model for the timeline
 * Handles conversion between time (milliseconds) and pixel coordinates
 */
export class TimeScale {
  constructor(
    public msPerPx: number,
    public viewStartMs: number = 0,
    public contentOffsetPx: number = 192 // Width of track labels column (w-48)
  ) {}

  /**
   * Convert time to pixel position
   */
  xOf(timeMs: number): number {
    return (timeMs - this.viewStartMs) / this.msPerPx + this.contentOffsetPx;
  }

  /**
   * Convert pixel position to time
   */
  tOf(pixelX: number): number {
    return (pixelX - this.contentOffsetPx) * this.msPerPx + this.viewStartMs;
  }

  /**
   * Get the end time of the current view
   */
  get viewEndMs(): number {
    return this.viewStartMs + this.viewWidthMs;
  }

  /**
   * Get the width of the view in milliseconds
   */
  get viewWidthMs(): number {
    // This will be set based on container width
    return 0; // Placeholder - will be updated by viewport
  }

  /**
   * Set the visible duration and optionally anchor to a specific pixel
   */
  setVisibleDuration(durationMs: number, viewportWidthPx: number, anchorPx?: number): TimeScale {
    const newMsPerPx = durationMs / viewportWidthPx;
    let newViewStartMs = this.viewStartMs;

    if (anchorPx !== undefined) {
      // Preserve the time at the anchor point
      const anchorTime = this.tOf(anchorPx);
      const newAnchorTime = anchorTime;
      newViewStartMs = newAnchorTime - (anchorPx - this.contentOffsetPx) * newMsPerPx;
    }

    // Clamp to ensure we don't go negative
    newViewStartMs = Math.max(0, newViewStartMs);

    return new TimeScale(newMsPerPx, newViewStartMs, this.contentOffsetPx);
  }

  /**
   * Pan the view by a pixel amount
   */
  panByPixels(deltaX: number): TimeScale {
    const deltaTime = deltaX * this.msPerPx;
    const newViewStartMs = Math.max(0, this.viewStartMs + deltaTime);
    return new TimeScale(this.msPerPx, newViewStartMs, this.contentOffsetPx);
  }

  /**
   * Snap time to a grid interval
   */
  snapTime(timeMs: number, snapIntervalMs: number = 500): number {
    return Math.round(timeMs / snapIntervalMs) * snapIntervalMs;
  }

  /**
   * Check if a time is visible in the current view
   */
  isTimeVisible(timeMs: number, viewportWidthPx: number): boolean {
    const viewEndMs = this.viewStartMs + viewportWidthPx * this.msPerPx;
    return timeMs >= this.viewStartMs && timeMs <= viewEndMs;
  }

  /**
   * Get zoom presets in milliseconds
   */
  static getZoomPresets(): { label: string; durationMs: number }[] {
    return [
      { label: '30s', durationMs: 30 * 1000 },
      { label: '1m', durationMs: 60 * 1000 },
      { label: '2m', durationMs: 2 * 60 * 1000 },
      { label: '5m', durationMs: 5 * 60 * 1000 },
      { label: '10m', durationMs: 10 * 60 * 1000 },
    ];
  }
}

/**
 * Generate "nice" tick intervals for time rulers
 */
export class TickGenerator {
  /**
   * Get appropriate tick interval based on pixels per tick
   */
  static getTickInterval(msPerPx: number, targetPixelsPerTick: number = 100): number {
    const msPerTick = msPerPx * targetPixelsPerTick;
    
    // Nice intervals in milliseconds
    const intervals = [
      500,      // 0.5s
      1000,     // 1s
      2000,     // 2s
      5000,     // 5s
      10000,    // 10s
      30000,    // 30s
      60000,    // 1m
      120000,   // 2m
      300000,   // 5m
      600000,   // 10m
    ];

    // Find the closest interval
    for (const interval of intervals) {
      if (interval >= msPerTick) {
        return interval;
      }
    }

    return intervals[intervals.length - 1];
  }

  /**
   * Generate tick marks for a given time range
   */
  static generateTicks(
    viewStartMs: number,
    viewEndMs: number,
    tickIntervalMs: number
  ): { timeMs: number; isMajor: boolean }[] {
    const ticks: { timeMs: number; isMajor: boolean }[] = [];
    
    // Start from the first tick before or at viewStartMs
    const firstTick = Math.floor(viewStartMs / tickIntervalMs) * tickIntervalMs;
    
    for (let timeMs = firstTick; timeMs <= viewEndMs + tickIntervalMs; timeMs += tickIntervalMs) {
      // Major ticks every 4th tick or at round numbers
      const isMajor = (timeMs / tickIntervalMs) % 4 === 0 || timeMs % (tickIntervalMs * 4) === 0;
      
      ticks.push({ timeMs, isMajor });
    }

    return ticks;
  }
}

/**
 * Utility functions for time formatting
 */
export class TimeFormatter {
  /**
   * Format time in MM:SS or HH:MM:SS format
   */
  static formatTime(timeMs: number): string {
    const totalSeconds = Math.floor(timeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Format time for tick labels (shorter format)
   */
  static formatTickLabel(timeMs: number): string {
    const totalSeconds = Math.floor(timeMs / 1000);
    
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (seconds === 0) {
      return `${minutes}m`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
