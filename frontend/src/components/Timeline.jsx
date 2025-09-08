import { useState, useRef, useEffect } from 'react';
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
  const [isDraggingCursor, setIsDraggingCursor] = useState(false);
  const timelineRef = useRef(null);
  const cursorRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate timeline cursor position
  const getCursorPosition = () => {
    if (!timelineRef.current) return 0;
    // Each time marker is 16px wide (w-16), and we have 60 markers total
    // The zoom affects the transform scale, so base position is without zoom
    const baseWidth = 60 * 16; // 60 time markers * 16px each
    const position = (currentTime / duration) * baseWidth * zoom;
    return Math.max(0, Math.min(position, baseWidth * zoom));
  };

  // Handle cursor drag start
  const handleCursorMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingCursor(true);
  };

  // Handle timeline click to seek
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || isDraggingCursor) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const rulerWidth = 60 * 16 * zoom; // Total scaled width
    const newTime = (clickX / rulerWidth) * duration;
    setCurrentTime(Math.max(0, Math.min(newTime, duration)));
  };

  // Handle mouse move for cursor dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingCursor || !timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const rulerWidth = 60 * 16 * zoom;
      const newTime = (mouseX / rulerWidth) * duration;
      setCurrentTime(Math.max(0, Math.min(newTime, duration)));
    };

    const handleMouseUp = () => {
      setIsDraggingCursor(false);
    };

    if (isDraggingCursor) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingCursor, duration, setCurrentTime, zoom]);

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
      <div className="border-b border-gray-700 bg-gray-800 p-2 relative">
        <div 
          ref={timelineRef}
          className="flex items-center space-x-2 overflow-x-auto cursor-crosshair relative"
          onClick={handleTimelineClick}
          style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left' }}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} className="flex-shrink-0 text-xs text-gray-400 w-16 text-center relative">
              {formatTime(i * 10)}
              {/* Tick marks */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-600"></div>
            </div>
          ))}
          
          {/* Timeline Cursor */}
          <div
            ref={cursorRef}
            className={`absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg cursor-ew-resize z-10 transition-opacity ${
              isDraggingCursor ? 'opacity-100' : 'opacity-80 hover:opacity-100'
            }`}
            style={{ 
              left: `${getCursorPosition()}px`,
              height: '100%',
              transform: `scaleX(${1/zoom})` // Counter-scale to maintain cursor width
            }}
            onMouseDown={handleCursorMouseDown}
          >
            {/* Cursor Head */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 border-2 border-white rounded-sm shadow-md cursor-ew-resize"></div>
            
            {/* Time Display */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Tracks */}
      <div className="flex-1 overflow-y-auto relative">
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
          
          {/* Extended Timeline Cursor through tracks */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg pointer-events-none z-20 opacity-60"
            style={{ 
              left: `${192 + getCursorPosition()}px`, // 192px = w-48 track header width
              transform: `scaleX(${1/zoom})` // Counter-scale to maintain cursor width
            }}
          />
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
