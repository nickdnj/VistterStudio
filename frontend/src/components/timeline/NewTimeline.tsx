/**
 * NewTimeline - Refactored timeline with proper viewport model
 * 
 * This is the main timeline component using the new time-domain viewport system.
 * It replaces the old CSS scaling approach with mathematical precision.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { Plus, Copy, Scissors, Trash2 } from 'lucide-react';
import { TimelineViewportProvider, useTimelineViewport } from '../../timeline/viewport/TimelineViewportContext';
import HeaderRuler from './HeaderRuler';
import Playhead from './Playhead';
import ZoomControl from './ZoomControl';
import TracksSurface from './TracksSurface';

interface TimelineProps {
  tracks: any[];
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  addTrack: (type: string) => void;
  removeTrack: (trackId: string) => void;
  addElementToTrack: (trackId: string, element: any) => void;
  updateTrackElement: (trackId: string, elementId: string, updates: any) => void;
  removeElementFromTrack: (trackId: string, elementId: string) => void;
  className?: string;
}

function TimelineContent({ 
  tracks, 
  currentTime, 
  setCurrentTime, 
  duration, 
  addTrack, 
  removeTrack, 
  addElementToTrack, 
  updateTrackElement, 
  removeElementFromTrack,
  className = '' 
}: TimelineProps) {
  const { state, actions } = useTimelineViewport();
  const timelineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync external time with internal state
  useEffect(() => {
    if (Math.abs(state.currentTimeMs - currentTime * 1000) > 100) {
      actions.setCurrentTime(currentTime * 1000);
    }
  }, [currentTime, state.currentTimeMs, actions]);

  // Sync external duration with internal state  
  useEffect(() => {
    const durationMs = duration * 1000;
    if (Math.abs(state.totalDurationMs - durationMs) > 100) {
      actions.setTotalDuration(durationMs);
    }
  }, [duration, state.totalDurationMs, actions]);

  // Update viewport width on resize
  useEffect(() => {
    const updateViewportWidth = () => {
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        actions.setViewportWidth(rect.width);
      }
    };

    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, [actions]);

  // Handle external time updates
  const handleTimeChange = useCallback((timeMs: number) => {
    const timeSeconds = timeMs / 1000;
    setCurrentTime(timeSeconds);
    actions.setCurrentTime(timeMs);
  }, [setCurrentTime, actions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={timelineRef} className={`bg-darker border-t border-gray-700 flex flex-col ${className}`}>
      {/* Timeline Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">Timeline</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => addTrack('overlay')}
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Track</span>
            </button>
            <div className="text-sm text-gray-400">
              {tracks.length} tracks
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Zoom Controls */}
          <ZoomControl />
          
          {/* Time Display */}
          <div className="flex items-center space-x-2">
            <div className="text-sm text-white font-mono">
              {formatTime(state.currentTimeMs / 1000)}
            </div>
            <button
              onClick={() => {
                // Find first element and jump to it
                const firstElement = tracks.flatMap(t => t.elements).sort((a, b) => a.startTime - b.startTime)[0];
                if (firstElement) {
                  handleTimeChange(firstElement.startTime * 1000);
                }
              }}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              Go to Start
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Content Grid */}
      <div 
        className="flex-1 grid overflow-hidden"
        style={{ 
          gridTemplateColumns: 'var(--timeline-label-col-width) 1fr',
          gridTemplateRows: 'var(--timeline-ruler-height) 1fr'
        }}
      >
        {/* Track Labels Header Spacer */}
        <div className="bg-gray-800 border-r border-gray-700" />
        
        {/* Timeline Ruler */}
        <div className="relative bg-gray-800 border-r border-gray-700 overflow-hidden">
          <HeaderRuler />
          <Playhead onScrub={handleTimeChange} />
        </div>
        
        {/* Track Labels Column */}
        <div className="bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-3 border-b border-gray-700"
              style={{ height: 'var(--timeline-track-height)' }}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  track.type === 'video' ? 'bg-blue-500' :
                  track.type === 'overlay' ? 'bg-green-500' :
                  track.type === 'audio' ? 'bg-yellow-500' : 'bg-gray-500'
                }`} />
                <span className="text-white text-sm font-medium">{track.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-700 rounded">
                  <Copy className="h-3 w-3 text-gray-400" />
                </button>
                {tracks.length > 1 && (
                  <button 
                    onClick={() => removeTrack(track.id)}
                    className="p-1 hover:bg-gray-700 rounded text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tracks Content */}
        <div ref={contentRef} className="relative overflow-auto">
          <TracksSurface
            tracks={tracks}
            onAddElement={addElementToTrack}
            onUpdateElement={updateTrackElement}
            onRemoveElement={removeElementFromTrack}
          />
          <Playhead onScrub={handleTimeChange} />
        </div>
      </div>

      {/* Timeline Footer */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Duration: {formatTime(state.totalDurationMs / 1000)}
            </div>
            <div className="text-sm text-gray-400">
              Elements: {tracks.reduce((sum, track) => sum + track.elements.length, 0)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="btn-secondary text-sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </button>
            <button className="btn-secondary text-sm">
              <Scissors className="h-4 w-4 mr-2" />
              Split
            </button>
            <button className="text-red-400 hover:text-red-300 p-2">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewTimeline(props: TimelineProps) {
  return (
    <TimelineViewportProvider 
      initialMsPerPx={100} 
      totalDuration={props.duration * 1000}
      contentOffsetPx={220}
    >
      <TimelineContent {...props} />
    </TimelineViewportProvider>
  );
}
