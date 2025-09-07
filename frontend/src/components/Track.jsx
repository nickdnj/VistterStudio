import { useState } from 'react';
import { Eye, EyeOff, Volume2, VolumeX, MoreVertical, Trash2, Lock, Unlock } from 'lucide-react';

const Track = ({ 
  track, 
  zoom, 
  currentTime, 
  onAddElement, 
  onUpdateElement, 
  onRemoveElement, 
  onRemoveTrack, 
  canRemove,
  isSelected 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = (x / zoom) / 10; // Convert pixel position to time

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'asset') {
        const newElement = {
          id: `element_${Date.now()}`,
          type: data.asset.category,
          name: data.asset.originalName,
          startTime: timePosition,
          duration: data.asset.category === 'images' ? 5 : 10, // Default durations
          assetUrl: data.asset.url,
          asset: data.asset
        };
        onAddElement(newElement);
      } else if (data.type === 'camera') {
        const newElement = {
          id: `element_${Date.now()}`,
          type: 'camera',
          name: data.camera.nickname,
          startTime: timePosition,
          duration: 10, // Default camera duration
          cameraId: data.cameraId,
          camera: data.camera
        };
        onAddElement(newElement);
      }
    } catch (error) {
      console.warn('Invalid drop data');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleElementDrag = (element, newStartTime) => {
    onUpdateElement(element.id, { startTime: Math.max(0, newStartTime) });
  };

  const handleElementResize = (element, newDuration) => {
    onUpdateElement(element.id, { duration: Math.max(0.1, newDuration) });
  };

  const getElementColor = (type) => {
    switch (type) {
      case 'images': return 'bg-green-500';
      case 'videos': return 'bg-blue-500';
      case 'audio': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`border-b border-gray-700 ${isSelected ? 'bg-gray-800' : ''}`}>
      <div className="flex">
        {/* Track Header */}
        <div className="w-48 bg-gray-800 border-r border-gray-700 p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm truncate">{track.name}</h4>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {isVisible ? (
                  <Eye className="h-3 w-3 text-gray-400" />
                ) : (
                  <EyeOff className="h-3 w-3 text-gray-500" />
                )}
              </button>
              
              {track.type === 'audio' && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {isMuted ? (
                    <VolumeX className="h-3 w-3 text-gray-500" />
                  ) : (
                    <Volume2 className="h-3 w-3 text-gray-400" />
                  )}
                </button>
              )}
              
              <button
                onClick={() => setIsLocked(!isLocked)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {isLocked ? (
                  <Lock className="h-3 w-3 text-yellow-500" />
                ) : (
                  <Unlock className="h-3 w-3 text-gray-400" />
                )}
              </button>
              
              {canRemove && (
                <button
                  onClick={onRemoveTrack}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded ${track.color}`}></div>
            <span className="text-xs text-gray-400 uppercase">{track.type}</span>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            {track.elements.length} element{track.elements.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Track Content */}
        <div 
          className="flex-1 relative min-h-16 bg-gray-900"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ opacity: isVisible ? 1 : 0.5 }}
        >
          {/* Track Elements */}
          {track.elements.map((element) => {
            const leftPosition = element.startTime * 10 * zoom;
            const width = element.duration * 10 * zoom;
            
            return (
              <div
                key={element.id}
                className={`absolute top-1 h-14 ${getElementColor(element.type)} rounded border border-gray-600 cursor-move overflow-hidden group`}
                style={{
                  left: `${leftPosition}px`,
                  width: `${Math.max(width, 20)}px`
                }}
                draggable={!isLocked}
                onDragStart={(e) => {
                  setDraggedElement(element);
                  e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'timeline-element',
                    element,
                    trackId: track.id
                  }));
                }}
              >
                {/* Element Content */}
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="text-white text-xs font-medium truncate">
                    {element.name}
                  </div>
                  <div className="text-white text-xs opacity-75">
                    {formatDuration(element.duration)}
                  </div>
                </div>

                {/* Resize Handles */}
                <div className="absolute left-0 top-0 w-2 h-full bg-black bg-opacity-50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity">
                </div>
                <div className="absolute right-0 top-0 w-2 h-full bg-black bg-opacity-50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity">
                </div>

                {/* Element Controls */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRemoveElement(element.id)}
                    className="p-1 bg-red-600 hover:bg-red-700 rounded text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Drop Zone Indicator */}
          <div className="absolute inset-0 border-2 border-dashed border-gray-600 opacity-0 hover:opacity-30 transition-opacity pointer-events-none">
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400 text-sm">Drop assets here</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Track;
