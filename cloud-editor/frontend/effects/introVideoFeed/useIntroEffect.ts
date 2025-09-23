import { useState, useEffect, useCallback, useRef } from 'react';
import { IntroEffectSettings } from '../../timeline/models/types';
import { thumbCache } from './thumbCache';

export interface ReadinessState {
  isReady: boolean;
  isStable: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface IntroEffectState {
  phase: 'loading' | 'lingering' | 'fading' | 'complete' | 'error';
  thumbnailImage: HTMLImageElement | null;
  readiness: ReadinessState;
  opacity: number;
}

export interface IntroEffectHookProps {
  sourceId: string;
  videoElement: HTMLVideoElement | null;
  settings: IntroEffectSettings;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const useIntroEffect = ({
  sourceId,
  videoElement,
  settings,
  onComplete,
  onError
}: IntroEffectHookProps) => {
  const [state, setState] = useState<IntroEffectState>({
    phase: 'loading',
    thumbnailImage: null,
    readiness: { isReady: false, isStable: false, hasError: false },
    opacity: 1
  });

  const timeoutsRef = useRef<{
    linger?: NodeJS.Timeout;
    maxWait?: NodeJS.Timeout;
    stability?: NodeJS.Timeout;
  }>({});

  const stabilityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load cached thumbnail
  useEffect(() => {
    if (!settings.enabled) return;

    const loadThumbnail = async () => {
      try {
        const cachedThumb = await thumbCache.getThumb(sourceId);
        setState(prev => ({
          ...prev,
          thumbnailImage: cachedThumb
        }));
      } catch (error) {
        console.warn('Failed to load cached thumbnail:', error);
      }
    };

    loadThumbnail();
  }, [sourceId, settings.enabled]);

  // Monitor video readiness
  const checkReadiness = useCallback(() => {
    if (!videoElement || !settings.enabled) return;

    const readiness: ReadinessState = {
      isReady: false,
      isStable: false,
      hasError: false
    };

    // Check for errors
    if (videoElement.error) {
      readiness.hasError = true;
      readiness.errorMessage = videoElement.error.message;
    } else {
      // Basic readiness
      readiness.isReady = videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      
      // Stability check - ensure we have enough buffered content
      if (readiness.isReady && settings.stabilitySeconds) {
        const buffered = videoElement.buffered;
        const currentTime = videoElement.currentTime;
        let bufferedAhead = 0;
        
        for (let i = 0; i < buffered.length; i++) {
          const start = buffered.start(i);
          const end = buffered.end(i);
          if (currentTime >= start && currentTime <= end) {
            bufferedAhead = end - currentTime;
            break;
          }
        }
        
        readiness.isStable = bufferedAhead >= settings.stabilitySeconds;
      } else {
        readiness.isStable = readiness.isReady;
      }
    }

    setState(prev => ({
      ...prev,
      readiness
    }));

    return readiness;
  }, [videoElement, settings.enabled, settings.stabilitySeconds]);

  // Handle video events
  useEffect(() => {
    if (!videoElement || !settings.enabled) return;

    const handleLoadedMetadata = () => checkReadiness();
    const handleCanPlay = () => checkReadiness();
    const handleCanPlayThrough = () => checkReadiness();
    const handleProgress = () => checkReadiness();
    const handleError = () => checkReadiness();

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('error', handleError);

    // Initial check
    checkReadiness();

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('error', handleError);
    };
  }, [videoElement, settings.enabled, checkReadiness]);

  // Handle phase transitions
  useEffect(() => {
    if (!settings.enabled) return;

    const { readiness } = state;
    
    // Clear existing timeouts
    Object.values(timeoutsRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    timeoutsRef.current = {};

    if (readiness.hasError) {
      setState(prev => ({ ...prev, phase: 'error' }));
      onError?.(readiness.errorMessage || 'Video failed to load');
      return;
    }

    if (readiness.isStable && state.phase === 'loading') {
      // Start linger phase
      setState(prev => ({ ...prev, phase: 'lingering' }));
      
      const lingerMs = settings.minLingerMs || 2000;
      timeoutsRef.current.linger = setTimeout(() => {
        setState(prev => ({ ...prev, phase: 'fading' }));
        startFadeOut();
      }, lingerMs);
    }

    // Max wait timeout
    if (state.phase === 'loading') {
      const maxWaitMs = settings.maxWaitMs || 12000;
      timeoutsRef.current.maxWait = setTimeout(() => {
        if (readiness.isReady || readiness.hasError) {
          setState(prev => ({ ...prev, phase: 'fading' }));
          startFadeOut();
        } else {
          setState(prev => ({ ...prev, phase: 'error' }));
          onError?.('Video failed to load within timeout');
        }
      }, maxWaitMs);
    }
  }, [state.readiness, state.phase, settings, onError]);

  // Fade out animation
  const startFadeOut = useCallback(() => {
    let opacity = 1;
    const fadeStep = 0.05; // 5% per step
    const fadeInterval = 16; // ~60fps

    fadeIntervalRef.current = setInterval(() => {
      opacity -= fadeStep;
      
      if (opacity <= 0) {
        opacity = 0;
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        setState(prev => ({ ...prev, phase: 'complete', opacity: 0 }));
        onComplete?.();
        
        // Capture fresh thumbnail for next time
        if (videoElement) {
          thumbCache.captureFromVideo(sourceId, videoElement).catch(console.warn);
        }
      } else {
        setState(prev => ({ ...prev, opacity }));
      }
    }, fadeInterval);
  }, [videoElement, sourceId, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      if (stabilityCheckRef.current) {
        clearInterval(stabilityCheckRef.current);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  // Reset effect when sourceId changes
  useEffect(() => {
    if (settings.enabled) {
      setState({
        phase: 'loading',
        thumbnailImage: null,
        readiness: { isReady: false, isStable: false, hasError: false },
        opacity: 1
      });
    }
  }, [sourceId, settings.enabled]);

  return {
    state,
    isActive: settings.enabled && state.phase !== 'complete',
    shouldShowOverlay: settings.enabled && ['loading', 'lingering', 'fading'].includes(state.phase),
    shouldShowVideo: !settings.enabled || state.phase === 'complete' || state.phase === 'fading'
  };
};
