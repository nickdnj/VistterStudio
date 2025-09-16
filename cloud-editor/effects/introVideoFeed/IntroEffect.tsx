import React from 'react';
import { Loader2 } from 'lucide-react';
import { IntroEffectSettings } from '../../timeline/models/types';
import { useIntroEffect } from './useIntroEffect';

export interface IntroEffectProps {
  sourceId: string;
  videoElement: HTMLVideoElement | null;
  settings: IntroEffectSettings;
  className?: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const IntroEffect: React.FC<IntroEffectProps> = ({
  sourceId,
  videoElement,
  settings,
  className = '',
  onComplete,
  onError
}) => {
  const { state, shouldShowOverlay } = useIntroEffect({
    sourceId,
    videoElement,
    settings,
    onComplete,
    onError
  });

  if (!shouldShowOverlay) {
    return null;
  }

  const message = settings.message || 'Video stream is loading…';
  const dimBackground = settings.dimBackground !== false;

  return (
    <div 
      className={`absolute inset-0 z-10 flex items-center justify-center ${className}`}
      style={{ opacity: state.opacity }}
    >
      {/* Background thumbnail or placeholder */}
      <div className="absolute inset-0">
        {state.thumbnailImage ? (
          <img
            src={state.thumbnailImage.src}
            alt="Video thumbnail"
            className={`w-full h-full object-cover ${
              dimBackground ? 'brightness-50 blur-sm' : ''
            }`}
          />
        ) : (
          <div className={`w-full h-full bg-gray-900 ${
            dimBackground ? 'opacity-80' : ''
          }`} />
        )}
      </div>

      {/* Overlay content */}
      <div className="relative z-20 flex flex-col items-center justify-center p-6 text-white">
        {state.phase === 'error' ? (
          <>
            <div className="w-12 h-12 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Unable to start stream</p>
            <p className="text-sm text-gray-300 text-center max-w-md">
              {state.readiness.errorMessage || 'The video stream could not be loaded. Please check your connection and try again.'}
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
            <p className="text-lg font-medium mb-2">{message}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150" />
              </div>
              <span>
                {state.phase === 'loading' && 'Connecting'}
                {state.phase === 'lingering' && 'Almost ready'}
                {state.phase === 'fading' && 'Ready'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Optional retry button for errors */}
      {state.phase === 'error' && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={() => {
              // Trigger a reload by dispatching a custom event
              const event = new CustomEvent('intro-effect-retry', { detail: { sourceId } });
              window.dispatchEvent(event);
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
