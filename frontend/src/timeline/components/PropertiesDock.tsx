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
import { TransitionType } from '../models/types';

interface PropertiesDockProps {
  className?: string;
}

// Helper function to get transition type display names
const getTransitionTypeLabel = (type: TransitionType): string => {
  switch (type) {
    case 'none': return 'None';
    case 'fade': return 'Fade';
    case 'slide-left': return 'Slide Left';
    case 'slide-right': return 'Slide Right';
    case 'slide-up': return 'Slide Up';
    case 'slide-down': return 'Slide Down';
    case 'scale-in': return 'Scale In';
    case 'scale-out': return 'Scale Out';
    case 'zoom-in': return 'Zoom In';
    case 'zoom-out': return 'Zoom Out';
    default: return type;
  }
};

const transitionTypes: TransitionType[] = [
  'none', 'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down',
  'scale-in', 'scale-out', 'zoom-in', 'zoom-out'
];

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

  const handleScaleChange = (value: string) => {
    const scale = parseFloat(value);
    if (!isNaN(scale) && scale >= 10 && scale <= 200) {
      updateClip(selectedClip.id, { scale });
    }
  };

  const handlePositionXChange = (value: string) => {
    const positionX = parseFloat(value);
    if (!isNaN(positionX) && positionX >= -100 && positionX <= 100) {
      updateClip(selectedClip.id, { positionX });
    }
  };

  const handlePositionYChange = (value: string) => {
    const positionY = parseFloat(value);
    if (!isNaN(positionY) && positionY >= -100 && positionY <= 100) {
      updateClip(selectedClip.id, { positionY });
    }
  };

  const handleTransitionInTypeChange = (value: TransitionType) => {
    updateClip(selectedClip.id, { transitionInType: value });
  };

  const handleTransitionInDurationChange = (value: string) => {
    const duration = parseFloat(value) * 1000; // Convert to ms
    if (!isNaN(duration) && duration >= 0 && duration <= 5000) {
      updateClip(selectedClip.id, { transitionInDuration: duration });
    }
  };

  const handleTransitionOutTypeChange = (value: TransitionType) => {
    updateClip(selectedClip.id, { transitionOutType: value });
  };

  const handleTransitionOutDurationChange = (value: string) => {
    const duration = parseFloat(value) * 1000; // Convert to ms
    if (!isNaN(duration) && duration >= 0 && duration <= 5000) {
      updateClip(selectedClip.id, { transitionOutDuration: duration });
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

            {/* Scale - Only for overlay clips */}
            {selectedTrack?.kind === 'overlay' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Scale</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={selectedClip.scale || 100}
                    onChange={(e) => handleScaleChange(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={selectedClip.scale || 100}
                    onChange={(e) => handleScaleChange(e.target.value)}
                    min="10"
                    max="200"
                    className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-xs"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            )}

            {/* Position X - Only for overlay clips */}
            {selectedTrack?.kind === 'overlay' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Position X</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={selectedClip.positionX || 0}
                    onChange={(e) => handlePositionXChange(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={selectedClip.positionX || 0}
                    onChange={(e) => handlePositionXChange(e.target.value)}
                    min="-100"
                    max="100"
                    className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-xs"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  -100 = Left, 0 = Center, 100 = Right
                </div>
              </div>
            )}

            {/* Position Y - Only for overlay clips */}
            {selectedTrack?.kind === 'overlay' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Position Y</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={selectedClip.positionY || 0}
                    onChange={(e) => handlePositionYChange(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={selectedClip.positionY || 0}
                    onChange={(e) => handlePositionYChange(e.target.value)}
                    min="-100"
                    max="100"
                    className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-xs"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  -100 = Top, 0 = Center, 100 = Bottom
                </div>
              </div>
            )}

            {/* Transitions - Only for overlay clips */}
            {selectedTrack?.kind === 'overlay' && (
              <>
                {/* Transition In */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Transition In</label>
                  <div className="space-y-2">
                    <select
                      value={selectedClip.transitionInType || 'fade'}
                      onChange={(e) => handleTransitionInTypeChange(e.target.value as TransitionType)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                    >
                      {transitionTypes.map(type => (
                        <option key={type} value={type}>
                          {getTransitionTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                    
                    {selectedClip.transitionInType !== 'none' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={(selectedClip.transitionInDuration || 500) / 1000}
                          onChange={(e) => handleTransitionInDurationChange(e.target.value)}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={((selectedClip.transitionInDuration || 500) / 1000).toFixed(1)}
                          onChange={(e) => handleTransitionInDurationChange(e.target.value)}
                          min="0"
                          max="5"
                          step="0.1"
                          className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-xs"
                        />
                        <span className="text-xs text-gray-400">s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transition Out */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Transition Out</label>
                  <div className="space-y-2">
                    <select
                      value={selectedClip.transitionOutType || 'fade'}
                      onChange={(e) => handleTransitionOutTypeChange(e.target.value as TransitionType)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                    >
                      {transitionTypes.map(type => (
                        <option key={type} value={type}>
                          {getTransitionTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                    
                    {selectedClip.transitionOutType !== 'none' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={(selectedClip.transitionOutDuration || 500) / 1000}
                          onChange={(e) => handleTransitionOutDurationChange(e.target.value)}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={((selectedClip.transitionOutDuration || 500) / 1000).toFixed(1)}
                          onChange={(e) => handleTransitionOutDurationChange(e.target.value)}
                          min="0"
                          max="5"
                          step="0.1"
                          className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white text-xs"
                        />
                        <span className="text-xs text-gray-400">s</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

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
                <div className="space-y-3">
                  <div className="text-xs text-gray-300">
                    <div>Camera: {selectedClip.camera.nickname || selectedClip.camera.name}</div>
                    <div>Type: {selectedClip.camera.type?.toUpperCase() || 'Unknown'}</div>
                    {selectedClip.camera.type === 'rtmp' && (
                      <>
                        <div>Host: {selectedClip.camera.host}:{selectedClip.camera.port}</div>
                        <div>Channel: {selectedClip.camera.channel} | Stream: {selectedClip.camera.stream}</div>
                      </>
                    )}
                  </div>

                  {/* RTMP Camera Controls */}
                  {selectedClip.camera.type === 'rtmp' && (
                    <div className="space-y-3">
                      <h6 className="text-xs text-gray-400 font-medium">Stream Controls</h6>
                      
                      {/* Pan/Tilt Controls (UI-based positioning) */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Position (X, Y)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={selectedClip.x || 0}
                              onChange={(e) => updateClip(selectedClip.id, { x: parseInt(e.target.value) })}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center mt-1">
                              X: {selectedClip.x || 0}
                            </div>
                          </div>
                          <div>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={selectedClip.y || 0}
                              onChange={(e) => updateClip(selectedClip.id, { y: parseInt(e.target.value) })}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center mt-1">
                              Y: {selectedClip.y || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Zoom/Scale Control */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Zoom: {selectedClip.scale || 100}%</label>
                        <input
                          type="range"
                          min="50"
                          max="300"
                          value={selectedClip.scale || 100}
                          onChange={(e) => updateClip(selectedClip.id, { scale: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>50%</span>
                          <span>300%</span>
                        </div>
                      </div>
                    </div>
                  )}
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
