import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Timeline Engine - Manages timeline playback and content rendering
 * This is the core engine that drives the preview output based on timeline composition
 */
class TimelineEngine {
  constructor() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 60; // Default timeline duration
    this.playbackRate = 1;
    this.tracks = [];
    this.subscribers = [];
    this.animationFrame = null;
    this.lastUpdateTime = Date.now();
  }

  // Subscribe to timeline updates
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers of timeline state changes
  notify() {
    this.subscribers.forEach(callback => callback({
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
      duration: this.duration,
      currentContent: this.getCurrentContent(),
      currentOverlays: this.getCurrentOverlays(),
      currentAudio: this.getCurrentAudio()
    }));
  }

  // Update timeline tracks
  setTracks(tracks) {
    this.tracks = tracks;
    // Recalculate duration based on timeline content
    this.duration = this.calculateTimelineDuration();
    this.notify();
  }

  // Calculate total timeline duration based on elements
  calculateTimelineDuration() {
    let maxDuration = 60; // Minimum duration
    this.tracks.forEach(track => {
      track.elements.forEach(element => {
        const elementEnd = element.startTime + element.duration;
        if (elementEnd > maxDuration) {
          maxDuration = elementEnd;
        }
      });
    });
    return Math.max(maxDuration, 60);
  }

  // Get current main content (video track)
  getCurrentContent() {
    const mainTrack = this.tracks.find(track => track.type === 'video' || track.id === 'main');
    if (!mainTrack) return null;

    const currentElement = mainTrack.elements.find(element => 
      this.currentTime >= element.startTime && 
      this.currentTime < element.startTime + element.duration
    );

    if (!currentElement) return null;

    return {
      ...currentElement,
      relativeTime: this.currentTime - currentElement.startTime, // Time within this element
      progress: (this.currentTime - currentElement.startTime) / currentElement.duration
    };
  }

  // Get current overlay elements
  getCurrentOverlays() {
    const overlays = [];
    this.tracks.forEach(track => {
      if (track.type === 'overlay') {
        track.elements.forEach(element => {
          if (this.currentTime >= element.startTime && 
              this.currentTime < element.startTime + element.duration) {
            overlays.push({
              ...element,
              trackId: track.id,
              trackName: track.name,
              relativeTime: this.currentTime - element.startTime,
              progress: (this.currentTime - element.startTime) / element.duration
            });
          }
        });
      }
    });
    return overlays;
  }

  // Get current audio elements
  getCurrentAudio() {
    const audioElements = [];
    this.tracks.forEach(track => {
      if (track.type === 'audio') {
        track.elements.forEach(element => {
          if (this.currentTime >= element.startTime && 
              this.currentTime < element.startTime + element.duration) {
            audioElements.push({
              ...element,
              trackId: track.id,
              trackName: track.name,
              relativeTime: this.currentTime - element.startTime,
              progress: (this.currentTime - element.startTime) / element.duration
            });
          }
        });
      }
    });
    return audioElements;
  }

  // Start playback
  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastUpdateTime = Date.now();
    this.startPlaybackLoop();
    this.notify();
  }

  // Pause playback
  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.notify();
  }

  // Stop playback and reset to beginning
  stop() {
    this.pause();
    this.currentTime = 0;
    this.notify();
  }

  // Seek to specific time
  seekTo(time) {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.notify();
  }

  // Start the playback animation loop
  startPlaybackLoop() {
    const updateTime = () => {
      if (!this.isPlaying) return;

      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = now;

      // Update current time
      this.currentTime += deltaTime * this.playbackRate;

      // Handle end of timeline
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.pause(); // Auto-pause at end
      }

      this.notify();

      // Schedule next frame
      if (this.isPlaying) {
        this.animationFrame = requestAnimationFrame(updateTime);
      }
    };

    this.animationFrame = requestAnimationFrame(updateTime);
  }

  // Set playback rate (for future use - 0.5x, 1x, 2x speed)
  setPlaybackRate(rate) {
    this.playbackRate = rate;
  }

  // Jump to next element in timeline
  jumpToNext() {
    const mainTrack = this.tracks.find(track => track.type === 'video' || track.id === 'main');
    if (!mainTrack) return;

    // Find next element after current time
    const nextElement = mainTrack.elements
      .filter(element => element.startTime > this.currentTime)
      .sort((a, b) => a.startTime - b.startTime)[0];

    if (nextElement) {
      this.seekTo(nextElement.startTime);
    }
  }

  // Jump to previous element in timeline
  jumpToPrevious() {
    const mainTrack = this.tracks.find(track => track.type === 'video' || track.id === 'main');
    if (!mainTrack) return;

    // Find previous element before current time
    const previousElement = mainTrack.elements
      .filter(element => element.startTime < this.currentTime)
      .sort((a, b) => b.startTime - a.startTime)[0];

    if (previousElement) {
      this.seekTo(previousElement.startTime);
    } else {
      this.seekTo(0); // Go to beginning if no previous element
    }
  }

  // Cleanup
  destroy() {
    this.pause();
    this.subscribers = [];
  }
}

// React Hook for using the Timeline Engine
export const useTimelineEngine = (initialTracks = []) => {
  const engineRef = useRef(null);
  const [timelineState, setTimelineState] = useState({
    currentTime: 0,
    isPlaying: false,
    duration: 60,
    currentContent: null,
    currentOverlays: [],
    currentAudio: []
  });

  // Initialize engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new TimelineEngine();
      
      // Subscribe to engine updates
      const unsubscribe = engineRef.current.subscribe(setTimelineState);
      
      return () => {
        unsubscribe();
        if (engineRef.current) {
          engineRef.current.destroy();
        }
      };
    }
  }, []);

  // Update tracks when they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTracks(initialTracks);
    }
  }, [initialTracks]);

  // Return engine controls and state
  return {
    ...timelineState,
    
    // Playback controls
    play: () => engineRef.current?.play(),
    pause: () => engineRef.current?.pause(),
    stop: () => engineRef.current?.stop(),
    seekTo: (time) => engineRef.current?.seekTo(time),
    
    // Navigation controls
    jumpToNext: () => engineRef.current?.jumpToNext(),
    jumpToPrevious: () => engineRef.current?.jumpToPrevious(),
    
    // Timeline controls
    setTracks: (tracks) => engineRef.current?.setTracks(tracks),
    setPlaybackRate: (rate) => engineRef.current?.setPlaybackRate(rate),
    
    // Direct access to engine for advanced use
    engine: engineRef.current
  };
};

export default TimelineEngine;
