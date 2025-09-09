import React, { useMemo } from 'react';
import { useTimelineStore } from '../state/store';
import { Clip } from '../models/types';

interface TimelinePreviewProps {
  cameras: Record<string, any>;
  getStreamUrl: (camera: any, type: string) => string;
  className?: string;
}

interface PreviewContent {
  type: 'camera' | 'asset';
  camera?: any;
  asset?: any;
  clip: Clip;
}

interface OverlayContent {
  clip: Clip;
  asset?: any;
  trackName: string;
}

export const TimelinePreview: React.FC<TimelinePreviewProps> = ({
  cameras,
  getStreamUrl,
  className = ''
}) => {
  const { currentTimeMs, tracks, getClipsAtTime } = useTimelineStore();

  // Get the current preview content and overlays based on timeline position
  const { previewContent, overlays } = useMemo(() => {
    const activeClips = getClipsAtTime(currentTimeMs);
    
    // Find the main video content (prioritize video tracks, then first available)
    let mainContent: PreviewContent | null = null;
    const overlayContents: OverlayContent[] = [];

    // Sort clips by track order to get proper layering
    const sortedTracks = tracks.sort((a, b) => a.order - b.order);
    
    for (const track of sortedTracks) {
      if (!track.isVisible) continue;
      
      const trackClips = activeClips.filter(clip => clip.trackId === track.id);
      
      for (const clip of trackClips) {
        if (!clip.enabled) continue;

        // For video tracks or main track, use as primary content
        if ((track.kind === 'video' || track.id === 'main') && !mainContent) {
          if (clip.cameraId && cameras[clip.cameraId]) {
            mainContent = {
              type: 'camera',
              camera: cameras[clip.cameraId],
              clip,
            };
          } else if (clip.asset) {
            mainContent = {
              type: 'asset',
              asset: clip.asset,
              clip,
            };
          }
        }
        
        // For overlay tracks, add to overlays list
        if (track.kind === 'overlay') {
          overlayContents.push({
            clip,
            asset: clip.asset,
            trackName: track.name,
          });
        }
      }
    }

    return {
      previewContent: mainContent,
      overlays: overlayContents,
    };
  }, [currentTimeMs, tracks, cameras, getClipsAtTime]);

  return {
    previewContent,
    overlays,
  };
};

// Hook for getting timeline preview data
export const useTimelinePreview = (
  cameras: Record<string, any>,
  getStreamUrl: (camera: any, type: string) => string
) => {
  const { currentTimeMs, tracks, getClipsAtTime } = useTimelineStore();

  return useMemo(() => {
    const activeClips = getClipsAtTime(currentTimeMs);
    
    // Find the main video content
    let previewContent: any = null;
    const overlays: any[] = [];

    // Sort tracks by order for proper layering
    const sortedTracks = tracks.sort((a, b) => a.order - b.order);
    
    for (const track of sortedTracks) {
      if (!track.isVisible) continue;
      
      const trackClips = activeClips.filter(clip => clip.trackId === track.id);
      
      for (const clip of trackClips) {
        if (!clip.enabled) continue;

        // For video tracks, use as primary content
        if ((track.kind === 'video' || track.id === 'main') && !previewContent) {
          if (clip.cameraId && cameras[clip.cameraId]) {
            previewContent = {
              type: 'camera',
              camera: cameras[clip.cameraId],
              element: clip, // Keep legacy naming for compatibility
            };
          } else if (clip.asset) {
            previewContent = {
              type: 'asset',
              asset: clip.asset,
              element: clip,
            };
          }
        }
        
        // For overlay tracks, add to overlays
        if (track.kind === 'overlay') {
          overlays.push({
            ...clip,
            trackId: track.id,
            trackName: track.name,
          });
        }
      }
    }

    return {
      previewContent,
      overlays,
    };
  }, [currentTimeMs, tracks, cameras, getClipsAtTime]);
};
