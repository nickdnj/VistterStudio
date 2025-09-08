/**
 * HeaderRuler - Time-based ruler with mathematical tick generation
 * 
 * This component generates ruler ticks based on time intervals rather than
 * DOM scaling, ensuring perfect alignment with track content at all zoom levels.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { useTimelineViewport } from '../../timeline/viewport/TimelineViewportContext';
import { getTickInterval } from '../../timeline/viewport/TimeScale';

interface HeaderRulerProps {
  className?: string;
}

interface TickInfo {
  timeMs: number;
  xPx: number;
  label: string;
  isMajor: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function generateTicks(
  viewStartMs: number,
  viewEndMs: number,
  msPerPx: number,
  xOfTime: (timeMs: number) => number
): TickInfo[] {
  const ticks: TickInfo[] = [];
  const interval = getTickInterval(msPerPx);
  
  // Generate major ticks at interval boundaries
  const startTick = Math.floor(viewStartMs / interval) * interval;
  const endTick = Math.ceil(viewEndMs / interval) * interval;
  
  for (let timeMs = startTick; timeMs <= endTick; timeMs += interval) {
    if (timeMs >= viewStartMs - interval && timeMs <= viewEndMs + interval) {
      ticks.push({
        timeMs,
        xPx: xOfTime(timeMs),
        label: formatTime(timeMs),
        isMajor: true
      });
    }
  }
  
  // Generate minor ticks (quarters of major interval) for detailed views
  if (msPerPx < 100) { // Only show minor ticks when zoomed in
    const minorInterval = interval / 4;
    for (let timeMs = startTick; timeMs <= endTick; timeMs += minorInterval) {
      // Skip if this would be a major tick
      if (timeMs % interval !== 0) {
        if (timeMs >= viewStartMs - interval && timeMs <= viewEndMs + interval) {
          ticks.push({
            timeMs,
            xPx: xOfTime(timeMs),
            label: '', // No labels for minor ticks
            isMajor: false
          });
        }
      }
    }
  }
  
  return ticks.sort((a, b) => a.timeMs - b.timeMs);
}

export default function HeaderRuler({ className = '' }: HeaderRulerProps) {
  const { state } = useTimelineViewport();
  const { timeScale, viewportWidthPx } = state;
  const rulerRef = useRef<HTMLDivElement>(null);
  
  const [viewStartMs, viewEndMs] = timeScale.getVisibleRange(viewportWidthPx);
  
  const ticks = useMemo(() => 
    generateTicks(
      viewStartMs,
      viewEndMs,
      timeScale.msPerPx,
      (timeMs) => timeScale.xOf(timeMs)
    ),
    [viewStartMs, viewEndMs, timeScale]
  );
  
  // Debug info (can be removed in production)
  const debugInfo = useMemo(() => ({
    msPerPx: timeScale.msPerPx.toFixed(1),
    viewRange: `${formatTime(viewStartMs)} - ${formatTime(viewEndMs)}`,
    contentOffset: timeScale.contentOffsetPx,
    tickCount: ticks.length
  }), [timeScale, viewStartMs, viewEndMs, ticks.length]);
  
  return (
    <div 
      ref={rulerRef}
      className={`bg-gray-800 border-b border-gray-700 relative overflow-hidden ${className}`}
      style={{ 
        height: 'var(--timeline-ruler-height)',
        minWidth: '100%'
      }}
    >
      {/* Timeline Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        {ticks.filter(tick => tick.isMajor).map(tick => (
          <div
            key={`grid-${tick.timeMs}`}
            className="absolute top-0 bottom-0 w-px bg-gray-600 opacity-20"
            style={{ left: `${tick.xPx}px` }}
          />
        ))}
      </div>
      
      {/* Time Ticks and Labels */}
      <div className="absolute inset-0">
        {ticks.map(tick => (
          <div
            key={`tick-${tick.timeMs}`}
            className="absolute flex flex-col items-center"
            style={{ 
              left: `${tick.xPx}px`,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Tick Line */}
            <div 
              className={`w-px ${
                tick.isMajor 
                  ? 'bg-gray-400 h-4 mt-2' 
                  : 'bg-gray-500 h-2 mt-4'
              }`}
            />
            
            {/* Time Label */}
            {tick.isMajor && tick.label && (
              <div className="text-xs text-gray-300 mt-1 font-mono whitespace-nowrap">
                {tick.label}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Debug Overlay (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-2 text-xs text-gray-500 font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
          <div>Zoom: {debugInfo.msPerPx}ms/px</div>
          <div>Range: {debugInfo.viewRange}</div>
          <div>Offset: {debugInfo.contentOffset}px</div>
          <div>Ticks: {debugInfo.tickCount}</div>
        </div>
      )}
    </div>
  );
}
