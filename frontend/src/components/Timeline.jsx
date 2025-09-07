import { useState } from 'react';
import { Plus, Trash2, Copy, Scissors, Volume2, Eye } from 'lucide-react';
import Track from './Track';

const Timeline = ({ 
  tracks,
  currentTime,
  setCurrentTime,
  duration,
  addTrack,
  removeTrack,
  addElementToTrack,
  updateTrackElement,
  removeElementFromTrack,
  className = "" 
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedElements, setSelectedElements] = useState([]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-darker border-t border-gray-700 flex flex-col ${className}`}>
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
          {/* Timeline Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-white">{Math.round(zoom * 100)}%</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-white font-mono">
              {formatTime(currentTime)}
            </div>
            <button
              onClick={() => {
                // Find first element and jump to it
                const firstElement = tracks.flatMap(t => t.elements).sort((a, b) => a.startTime - b.startTime)[0];
                if (firstElement) {
                  setCurrentTime(firstElement.startTime);
                }
              }}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              Go to Start
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="border-b border-gray-700 bg-gray-800 p-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} className="flex-shrink-0 text-xs text-gray-400 w-16 text-center">
              {formatTime(i * 10)}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Tracks */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          {tracks.map((track, index) => (
            <Track
              key={track.id}
              track={track}
              zoom={zoom}
              currentTime={currentTime}
              onAddElement={(element) => addElementToTrack(track.id, element)}
              onUpdateElement={(elementId, updates) => updateTrackElement(track.id, elementId, updates)}
              onRemoveElement={(elementId) => removeElementFromTrack(track.id, elementId)}
              onRemoveTrack={() => removeTrack(track.id)}
              canRemove={tracks.length > 1}
              isSelected={selectedElements.some(el => el.trackId === track.id)}
            />
          ))}
        </div>
      </div>

      {/* Timeline Footer */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Duration: {formatTime(Math.max(...tracks.flatMap(t => t.elements.map(e => e.startTime + e.duration)), 0))}
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
};

export default Timeline;
