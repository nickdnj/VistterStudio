import React, { useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Repeat
} from 'lucide-react';
import { useTimelineStore } from '../state/store';
import { TimeFormatter, TimeScale } from '../models/TimeScale';
import { PlaybackRate } from '../models/types';

interface TimelineTransportProps {
  className?: string;
}

export const TimelineTransport: React.FC<TimelineTransportProps> = ({ className = '' }) => {
  const {
    currentTimeMs,
    isPlaying,
    isLooping,
    playbackRate,
    viewport,
    tracks,
    clips,
    play,
    pause,
    stop,
    setCurrentTime,
    setPlaybackRate,
    toggleLoop,
    setZoom,
    addTrack,
    clearTimeline,
    undo,
    redo,
    canUndo,
    canRedo,
    getDynamicDuration,
  } = useTimelineStore();

  // Calculate total timeline duration dynamically based on main track
  const totalDurationMs = getDynamicDuration();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ': // Spacebar
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'Home':
          e.preventDefault();
          setCurrentTime(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentTime(totalDurationMs);
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          setPlaybackRate(0.5);
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setPlaybackRate(2);
          break;
        case 'z':
        case 'Z':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (confirm('Are you sure you want to clear the entire timeline? This cannot be undone.')) {
              clearTimeline();
            }
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          toggleLoop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, totalDurationMs, play, pause, setCurrentTime, setPlaybackRate, undo, redo, clearTimeline, toggleLoop]);

  // Jump to start/end
  const jumpToStart = () => setCurrentTime(0);
  const jumpToEnd = () => setCurrentTime(totalDurationMs);

  // Rate buttons
  const rateButtons: { rate: PlaybackRate; label: string }[] = [
    { rate: 0.5, label: '0.5×' },
    { rate: 1, label: '1×' },
    { rate: 2, label: '2×' },
  ];

  // Zoom presets
  const zoomPresets = TimeScale.getZoomPresets();

  return (
    <div className={`flex items-center justify-between p-4 bg-gray-800 border-t border-gray-700 ${className}`}>
      {/* Left side - Playback controls */}
      <div className="flex items-center space-x-3">
        {/* Jump to start */}
        <button
          onClick={jumpToStart}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Jump to start (Home)"
        >
          <SkipBack className="h-4 w-4 text-white" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? pause : play}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Stop */}
        <button
          onClick={stop}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Stop"
        >
          <Square className="h-4 w-4 text-white" />
        </button>

        {/* Jump to end */}
        <button
          onClick={jumpToEnd}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Jump to end (End)"
        >
          <SkipForward className="h-4 w-4 text-white" />
        </button>

        {/* Repeat/Loop button */}
        <button
          onClick={toggleLoop}
          className={`
            p-2 rounded-lg transition-colors ml-4
            ${isLooping 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }
          `}
          title={`${isLooping ? 'Disable' : 'Enable'} loop/repeat (R)`}
        >
          <Repeat className="h-4 w-4" />
        </button>

        {/* Playback rate */}
        <div className="flex items-center space-x-1 ml-4">
          <span className="text-xs text-gray-400">Rate:</span>
          {rateButtons.map(({ rate, label }) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`
                px-2 py-1 text-xs rounded transition-colors
                ${playbackRate === rate 
                  ? 'bg-primary text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
              title={`Playback rate ${label} ${rate === 0.5 ? '(J)' : rate === 1 ? '(K)' : '(L)'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-600 ml-4" />

        {/* Timeline management controls */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={`
              p-2 rounded-lg transition-colors
              ${canUndo() 
                ? 'hover:bg-gray-700 text-white' 
                : 'text-gray-600 cursor-not-allowed'
              }
            `}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo()}
            className={`
              p-2 rounded-lg transition-colors
              ${canRedo() 
                ? 'hover:bg-gray-700 text-white' 
                : 'text-gray-600 cursor-not-allowed'
              }
            `}
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear the entire timeline? This cannot be undone.')) {
                clearTimeline();
              }
            }}
            className="p-2 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
            title="Clear Timeline (Ctrl+Delete)"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center - Timecode display */}
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div className="text-lg font-mono text-white">
            {TimeFormatter.formatTime(currentTimeMs)}
          </div>
          <div className="text-xs text-gray-400">
            / {TimeFormatter.formatTime(totalDurationMs)}
          </div>
        </div>
      </div>

      {/* Right side - Zoom and track controls */}
      <div className="flex items-center space-x-3">
        {/* Zoom presets */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-400">Zoom:</span>
          {zoomPresets.map(({ label, durationMs }) => (
            <button
              key={label}
              onClick={() => setZoom(durationMs)}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title={`Show ${label} in timeline`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Add track */}
        <button
          onClick={() => addTrack({
            name: `Track ${tracks.length + 1}`,
            kind: 'overlay',
            color: 'bg-purple-600',
          })}
          className="flex items-center space-x-2 px-3 py-1 bg-primary hover:bg-blue-600 text-white text-sm rounded transition-colors"
          title="Add new track"
        >
          <Plus className="h-4 w-4" />
          <span>Add Track</span>
        </button>

        {/* Timeline stats */}
        <div className="text-xs text-gray-400">
          <div>{tracks.length} tracks</div>
          <div>{clips.length} clips</div>
        </div>
      </div>
    </div>
  );
};
