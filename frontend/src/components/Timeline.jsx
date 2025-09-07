import { useState } from 'react';
import { Plus, Trash2, Copy, Scissors, Volume2, Eye } from 'lucide-react';
import Track from './Track';

const Timeline = ({ className = "" }) => {
  const [tracks, setTracks] = useState([
    { id: 'main', name: 'Main Track', type: 'video', elements: [], color: 'bg-blue-600' },
    { id: 'overlay1', name: 'Overlay 1', type: 'overlay', elements: [], color: 'bg-green-600' },
    { id: 'overlay2', name: 'Overlay 2', type: 'overlay', elements: [], color: 'bg-purple-600' },
    { id: 'audio', name: 'Audio', type: 'audio', elements: [], color: 'bg-orange-600' },
  ]);
  
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedElements, setSelectedElements] = useState([]);

  const addTrack = (type = 'overlay') => {
    const newTrack = {
      id: `${type}_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.filter(t => t.type === type).length + 1}`,
      type,
      elements: [],
      color: type === 'video' ? 'bg-blue-600' :
             type === 'overlay' ? 'bg-green-600' :
             type === 'audio' ? 'bg-orange-600' : 'bg-gray-600'
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (trackId) => {
    if (tracks.length <= 1) return; // Keep at least one track
    setTracks(tracks.filter(track => track.id !== trackId));
  };

  const addElementToTrack = (trackId, element) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, elements: [...track.elements, element] }
        : track
    ));
  };

  const updateTrackElement = (trackId, elementId, updates) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { 
            ...track, 
            elements: track.elements.map(el => 
              el.id === elementId ? { ...el, ...updates } : el
            )
          }
        : track
    ));
  };

  const removeElementFromTrack = (trackId, elementId) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, elements: track.elements.filter(el => el.id !== elementId) }
        : track
    ));
  };

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
          
          <div className="text-sm text-white font-mono">
            {formatTime(timelinePosition)}
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
              timelinePosition={timelinePosition}
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
