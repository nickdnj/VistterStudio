import React, { useCallback } from 'react';
import { Eye, EyeOff, Volume2, VolumeX, Lock, Unlock, Trash2 } from 'lucide-react';
import { useTimelineStore } from '../state/store';
import { ClipView } from './ClipView';
import { DropData } from '../models/types';

interface TracksSurfaceProps {
  className?: string;
}

export const TracksSurface: React.FC<TracksSurfaceProps> = ({ className = '' }) => {
  const {
    tracks,
    clips,
    viewport,
    timeScale,
    addClip,
    updateTrack,
    removeTrack,
    snapTime,
  } = useTimelineStore();

  // Handle drag over for drop zones
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop on track
  const handleDrop = useCallback((e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    
    try {
      const data: DropData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      // Convert drop position to time (dropX is relative to content area)
      const dropTimeMs = viewport.viewStartMs + (dropX * viewport.msPerPx);
      const snappedTimeMs = snapTime(Math.max(0, dropTimeMs));

      if (data.type === 'camera') {
        addClip({
          trackId,
          kind: 'video',
          sourceId: data.cameraId!,
          startMs: snappedTimeMs,
          durationMs: 10 * 1000, // 10 seconds default
          name: data.camera?.nickname || 'Camera Feed',
          cameraId: data.cameraId,
          camera: data.camera,
        });
      } else if (data.type === 'asset') {
        const isImage = data.asset?.category === 'images';
        const isVideo = data.asset?.category === 'videos';
        const isAudio = data.asset?.category === 'audio';
        
        let clipKind: 'video' | 'overlay' | 'audio' = 'overlay';
        let defaultDuration = 5 * 1000; // 5 seconds for images
        
        if (isVideo) {
          clipKind = 'video';
          defaultDuration = 10 * 1000; // 10 seconds for videos
        } else if (isAudio) {
          clipKind = 'audio';
          defaultDuration = 30 * 1000; // 30 seconds for audio
        }

        addClip({
          trackId,
          kind: clipKind,
          sourceId: data.asset?.id || 'unknown',
          startMs: snappedTimeMs,
          durationMs: defaultDuration,
          name: data.asset?.originalName || 'Media Asset',
          asset: data.asset,
        });
      }
    } catch (error) {
      console.warn('Invalid drop data:', error);
    }
  }, [timeScale, snapTime, addClip]);

  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      {tracks
        .sort((a, b) => a.order - b.order)
        .map((track) => {
          const trackClips = clips.filter(clip => clip.trackId === track.id);
          
          return (
            <div key={track.id} className="border-b border-gray-700 flex">
              {/* Track Header */}
              <div 
                className="bg-gray-800 border-r border-gray-700 p-3 flex-shrink-0"
                style={{ width: viewport.contentOffsetPx }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium text-sm truncate flex-1 mr-2">
                    {track.name}
                  </h4>
                  
                  <div className="flex items-center space-x-1">
                    {/* Visibility toggle */}
                    <button
                      onClick={() => updateTrack(track.id, { isVisible: !track.isVisible })}
                      className="p-1 hover:bg-gray-700 rounded"
                      title={track.isVisible ? 'Hide track' : 'Show track'}
                    >
                      {track.isVisible ? (
                        <Eye className="h-3 w-3 text-gray-400" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-gray-500" />
                      )}
                    </button>
                    
                    {/* Audio mute toggle (for audio tracks) */}
                    {track.kind === 'audio' && (
                      <button
                        onClick={() => updateTrack(track.id, { isMuted: !track.isMuted })}
                        className="p-1 hover:bg-gray-700 rounded"
                        title={track.isMuted ? 'Unmute track' : 'Mute track'}
                      >
                        {track.isMuted ? (
                          <VolumeX className="h-3 w-3 text-gray-500" />
                        ) : (
                          <Volume2 className="h-3 w-3 text-gray-400" />
                        )}
                      </button>
                    )}
                    
                    {/* Lock toggle */}
                    <button
                      onClick={() => updateTrack(track.id, { isLocked: !track.isLocked })}
                      className="p-1 hover:bg-gray-700 rounded"
                      title={track.isLocked ? 'Unlock track' : 'Lock track'}
                    >
                      {track.isLocked ? (
                        <Lock className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <Unlock className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                    
                    {/* Delete track (if not the last one) */}
                    {tracks.length > 1 && (
                      <button
                        onClick={() => removeTrack(track.id)}
                        className="p-1 hover:bg-gray-700 rounded"
                        title="Delete track"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Track info */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${track.color}`} />
                  <span className="text-xs text-gray-400 uppercase">{track.kind}</span>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  {trackClips.length} clip{trackClips.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Track Content Area */}
              <div 
                className={`
                  flex-1 relative min-h-16 bg-gray-900 
                  ${!track.isVisible ? 'opacity-50' : ''}
                  ${track.isLocked ? 'cursor-not-allowed' : ''}
                `}
                onDrop={(e) => !track.isLocked && handleDrop(e, track.id)}
                onDragOver={handleDragOver}
              >
                {/* Track clips */}
                {trackClips.map((clip) => (
                  <ClipView
                    key={clip.id}
                    clip={clip}
                    trackId={track.id}
                  />
                ))}

                {/* Drop zone indicator */}
                {!track.isLocked && (
                  <div className="absolute inset-0 border-2 border-dashed border-gray-600 opacity-0 hover:opacity-30 transition-opacity pointer-events-none">
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400 text-sm">
                        Drop {track.kind === 'video' ? 'cameras/videos' : 
                              track.kind === 'audio' ? 'audio files' : 
                              'images/overlays'} here
                      </span>
                    </div>
                  </div>
                )}

                {/* Grid lines for visual alignment */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    backgroundImage: `linear-gradient(to right, #4a5568 0px, #4a5568 1px, transparent 1px)`,
                  }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};
