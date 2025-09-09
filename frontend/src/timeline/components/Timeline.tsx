import React, { useEffect, useRef, useCallback } from 'react';
import { useTimelineStore } from '../state/store';
import { HeaderRuler } from './HeaderRuler';
import { Playhead } from './Playhead';
import { TracksSurface } from './TracksSurface';
import { TimelineTransport } from './TimelineTransport';

interface TimelineProps {
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ className = '' }) => {
  const { viewport, setViewport, panView } = useTimelineStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update viewport dimensions when container resizes
  const updateViewportDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const contentWidth = rect.width - viewport.contentOffsetPx;
      
      setViewport({
        viewportWidthPx: Math.max(100, contentWidth), // Minimum 100px
      });
    }
  }, [viewport.contentOffsetPx, setViewport]);

  // Handle horizontal scroll for panning
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const deltaX = scrollLeft * viewport.msPerPx;
    
    // Update view start time based on scroll position
    setViewport({
      viewStartMs: Math.max(0, deltaX),
    });
  }, [viewport.msPerPx, setViewport]);

  // Handle wheel events for zoom (with Ctrl/Cmd) and pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // Zoom with Ctrl/Cmd + wheel
      const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
      const currentVisibleMs = viewport.viewportWidthPx * viewport.msPerPx;
      const newVisibleMs = currentVisibleMs * zoomFactor;
      
      // Get mouse position for anchor point
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      // Apply zoom anchored at mouse position
      const { setZoom } = useTimelineStore.getState();
      setZoom(newVisibleMs, mouseX);
    } else {
      // Pan with regular wheel
      const panAmount = e.deltaX || e.deltaY;
      panView(panAmount);
    }
  }, [viewport.viewportWidthPx, viewport.msPerPx, panView]);

  // Set up resize observer
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateViewportDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateViewportDimensions]);

  // Initial viewport setup
  useEffect(() => {
    updateViewportDimensions();
  }, [updateViewportDimensions]);

  // Calculate scroll position for synchronized scrolling
  const scrollLeft = viewport.viewStartMs / viewport.msPerPx;

  return (
    <div className={`flex flex-col bg-darker border-t border-gray-700 ${className}`}>
      {/* Timeline Transport */}
      <TimelineTransport />

      {/* Timeline Content */}
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col min-h-0 relative"
        onWheel={handleWheel}
      >
        {/* Header Ruler */}
        <HeaderRuler height={40} />

        {/* Scrollable Content Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a5568 #2d3748',
          }}
          onScroll={handleScroll}
        >
          {/* Content with proper width for scrolling */}
          <div
            ref={contentRef}
            className="relative"
            style={{
              width: viewport.contentOffsetPx + Math.max(
                viewport.viewportWidthPx,
                10 * 60 * 1000 / viewport.msPerPx // 10 minutes minimum width
              ),
              minHeight: '100%',
            }}
          >
            {/* Tracks Surface */}
            <TracksSurface className="absolute inset-0" />

            {/* Playhead */}
            <Playhead 
              height={containerRef.current?.clientHeight || 400}
              className="absolute inset-0 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .timeline-scrollbar::-webkit-scrollbar {
          height: 12px;
        }
        .timeline-scrollbar::-webkit-scrollbar-track {
          background: #2d3748;
        }
        .timeline-scrollbar::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 6px;
        }
        .timeline-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      `}</style>
    </div>
  );
};
