import React, { useState } from 'react';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTimelineStore } from '../state/store';
import { TimeFormatter } from '../models/TimeScale';

interface PropertiesDockProps {
  className?: string;
}

export const PropertiesDock: React.FC<PropertiesDockProps> = ({ className = '' }) => {
  const {
    selectedClipId,
    clips,
    tracks,
    updateClip,
    removeClip,
    selectClip,
  } = useTimelineStore();

  const [isExpanded, setIsExpanded] = useState(true);

  const selectedClip = selectedClipId ? clips.find(c => c.id === selectedClipId) : null;
  const selectedTrack = selectedClip ? tracks.find(t => t.id === selectedClip.trackId) : null;

  if (!selectedClip) {
    return (
      <div className={`bg-gray-800 border-t border-gray-700 ${className}`}>
        <div className="p-4 text-center">
          <Settings className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Select a clip to edit properties</p>
        </div>
      </div>
    );
  }

  // Handle property updates
  const handleStartTimeChange = (value: string) => {
    const timeMs = parseFloat(value) * 1000;
    if (!isNaN(timeMs) && timeMs >= 0) {
      updateClip(selectedClip.id, { startMs: timeMs });
    }
  };

  const handleDurationChange = (value: string) => {
    const durationMs = parseFloat(value) * 1000;
    if (!isNaN(durationMs) && durationMs >= 500) { // Min 0.5s
      updateClip(selectedClip.id, { durationMs });
    }
  };

  const handleEndTimeChange = (value: string) => {
    const endTimeMs = parseFloat(value) * 1000;
    if (!isNaN(endTimeMs) && endTimeMs > selectedClip.startMs) {
      const newDurationMs = endTimeMs - selectedClip.startMs;
      updateClip(selectedClip.id, { durationMs: newDurationMs });
    }
  };

  const handleOpacityChange = (value: string) => {
    const opacity = parseFloat(value);
    if (!isNaN(opacity) && opacity >= 0 && opacity <= 100) {
      updateClip(selectedClip.id, { opacity });
    }
  };

  const handleNameChange = (value: string) => {
    updateClip(selectedClip.id, { name: value });
  };

  const handleEnabledToggle = () => {
    updateClip(selectedClip.id, { enabled: !selectedClip.enabled });
  };

  const handleDuplicate = () => {
    // Create a copy of the clip with a new ID and offset position
    const newClip = {
      ...selectedClip,
      id: `clip_${Date.now()}`,
      startMs: selectedClip.startMs + selectedClip.durationMs,
      name: `${selectedClip.name} Copy`,
    };
    
    // Add via store action (we'd need to expose this)
    // For now, just show in console
    console.log('Would duplicate clip:', newClip);
  };

  const handleDelete = () => {
    removeClip(selectedClip.id);
    selectClip(null);
  };

  const startTimeSeconds = selectedClip.startMs / 1000;
  const durationSeconds = selectedClip.durationMs / 1000;
  const endTimeSeconds = (selectedClip.startMs + selectedClip.durationMs) / 1000;

  return (
    <div className={`bg-gray-800 border-t border-gray-700 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-700 p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-gray-400" />
            <span className="text-white font-medium">Clip Properties</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Clip info */}
          <div className="border-b border-gray-700 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium text-sm truncate">
                {selectedClip.name || 'Unnamed Clip'}
              </h4>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleEnabledToggle}
                  className="p-1 hover:bg-gray-700 rounded"
                  title={selectedClip.enabled ? 'Disable clip' : 'Enable clip'}
                >
                  {selectedClip.enabled ? (
                    <Eye className="h-3 w-3 text-green-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              Track: {selectedTrack?.name} ({selectedTrack?.kind})
            </div>
          </div>

          {/* Timing properties */}
          <div className="space-y-3">
            <h5 className="text-xs text-gray-400 uppercase font-medium">Timing</h5>
            
            {/* Start Time */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Time</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={startTimeSeconds.toFixed(1)}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  step="0.1"
                  min="0"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <span className="text-xs text-gray-400">s</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {TimeFormatter.formatTime(selectedClip.startMs)}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={durationSeconds.toFixed(1)}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  step="0.1"
                  min="0.5"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <span className="text-xs text-gray-400">s</span>
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">End Time</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={endTimeSeconds.toFixed(1)}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  step="0.1"
                  min={(selectedClip.startMs / 1000 + 0.5).toFixed(1)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <span className="text-xs text-gray-400">s</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {TimeFormatter.formatTime(selectedClip.startMs + selectedClip.durationMs)}
              </div>
            </div>
          </div>

          {/* Visual properties */}
          <div className="space-y-3">
            <h5 className="text-xs text-gray-400 uppercase font-medium">Visual</h5>
            
            {/* Opacity */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Opacity</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedClip.opacity || 100}
                  onChange={(e) => handleOpacityChange(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="number"
                  value={selectedClip.opacity || 100}
                  onChange={(e) => handleOpacityChange(e.target.value)}
                  min="0"
                  max="100"
                  className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-xs"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={selectedClip.name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                placeholder="Clip name..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handleDuplicate}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
              >
                <Copy className="h-3 w-3" />
                <span>Duplicate</span>
              </button>
              
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Source info */}
          {(selectedClip.camera || selectedClip.asset) && (
            <div className="border-t border-gray-700 pt-4">
              <h5 className="text-xs text-gray-400 uppercase font-medium mb-2">Source</h5>
              {selectedClip.camera && (
                <div className="text-xs text-gray-300">
                  <div>Camera: {selectedClip.camera.nickname}</div>
                  <div>Model: {selectedClip.camera.product_model}</div>
                </div>
              )}
              {selectedClip.asset && (
                <div className="text-xs text-gray-300">
                  <div>File: {selectedClip.asset.originalName}</div>
                  <div>Type: {selectedClip.asset.category}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
