import React, { useMemo } from 'react';
import { useTimelineStore } from '../state/store';
import { TickGenerator, TimeFormatter } from '../models/TimeScale';

interface HeaderRulerProps {
  height?: number;
  className?: string;
}

export const HeaderRuler: React.FC<HeaderRulerProps> = ({ 
  height = 32, 
  className = '' 
}) => {
  const { viewport, timeScale } = useTimelineStore();

  // Generate ticks based on current zoom level
  const ticks = useMemo(() => {
    const viewEndMs = viewport.viewStartMs + viewport.viewportWidthPx * viewport.msPerPx;
    const tickIntervalMs = TickGenerator.getTickInterval(viewport.msPerPx, 80);
    
    return TickGenerator.generateTicks(
      viewport.viewStartMs,
      viewEndMs,
      tickIntervalMs
    );
  }, [viewport.viewStartMs, viewport.viewportWidthPx, viewport.msPerPx]);

  return (
    <div 
      className={`relative bg-gray-800 border-b border-gray-700 ${className}`}
      style={{ height }}
    >
      {/* Labels column spacer */}
      <div 
        className="absolute left-0 top-0 h-full bg-gray-800 border-r border-gray-700"
        style={{ width: viewport.contentOffsetPx }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-xs text-gray-400 font-medium">TIME</span>
        </div>
      </div>

      {/* Tick marks and labels */}
      <div 
        className="absolute top-0 h-full"
        style={{ 
          left: viewport.contentOffsetPx,
          right: 0,
        }}
      >
        {ticks.map(({ timeMs, isMajor }) => {
          const x = timeScale.xOf(timeMs) - viewport.contentOffsetPx;
          
          // Don't render ticks outside the visible area
          if (x < -20 || x > viewport.viewportWidthPx + 20) {
            return null;
          }

          return (
            <div
              key={timeMs}
              className="absolute top-0 flex flex-col items-center pointer-events-none"
              style={{ left: x, transform: 'translateX(-50%)' }}
            >
              {/* Tick mark */}
              <div 
                className={`bg-gray-400 ${isMajor ? 'w-px h-4' : 'w-px h-2'}`}
                style={{ marginTop: isMajor ? 0 : 8 }}
              />
              
              {/* Tick label - only show on major ticks */}
              {isMajor && (
                <div className="mt-1">
                  <span className="text-xs text-gray-300 font-mono leading-none">
                    {TimeFormatter.formatTickLabel(timeMs)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-1 right-2">
        <span className="text-xs text-gray-500">
          {TimeFormatter.formatTime(viewport.viewportWidthPx * viewport.msPerPx)} visible
        </span>
      </div>
    </div>
  );
};
