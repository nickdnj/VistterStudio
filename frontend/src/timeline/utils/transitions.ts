import { TransitionType, Clip } from '../models/types';

export interface TransitionState {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
}

/**
 * Calculate the current transition state for a clip based on the current time
 */
export function calculateTransitionState(
  clip: Clip,
  currentTimeMs: number,
  baseOpacity: number = 1,
  baseScale: number = 1,
  baseTranslateX: number = 0,
  baseTranslateY: number = 0
): TransitionState {
  const clipStartMs = clip.startMs;
  const clipEndMs = clip.startMs + clip.durationMs;
  const transitionInDuration = clip.transitionInDuration || 500;
  const transitionOutDuration = clip.transitionOutDuration || 500;
  
  // Default state
  let state: TransitionState = {
    opacity: baseOpacity,
    scale: baseScale,
    translateX: baseTranslateX,
    translateY: baseTranslateY,
  };

  // Check if we're in transition in period
  if (currentTimeMs >= clipStartMs && currentTimeMs <= clipStartMs + transitionInDuration) {
    const progress = (currentTimeMs - clipStartMs) / transitionInDuration;
    state = applyTransition(clip.transitionInType || 'fade', progress, state, true);
  }
  // Check if we're in transition out period
  else if (currentTimeMs >= clipEndMs - transitionOutDuration && currentTimeMs <= clipEndMs) {
    const progress = (currentTimeMs - (clipEndMs - transitionOutDuration)) / transitionOutDuration;
    state = applyTransition(clip.transitionOutType || 'fade', 1 - progress, state, false);
  }

  return state;
}

/**
 * Apply a specific transition effect
 */
function applyTransition(
  transitionType: TransitionType,
  progress: number, // 0 to 1
  baseState: TransitionState,
  isTransitionIn: boolean
): TransitionState {
  // Ensure progress is between 0 and 1
  progress = Math.max(0, Math.min(1, progress));
  
  // Apply easing function for smoother transitions
  const easedProgress = easeInOutCubic(progress);

  switch (transitionType) {
    case 'none':
      return baseState;

    case 'fade':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
      };

    case 'slide-left':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        translateX: baseState.translateX + (isTransitionIn ? (1 - easedProgress) * -100 : easedProgress * -100),
      };

    case 'slide-right':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        translateX: baseState.translateX + (isTransitionIn ? (1 - easedProgress) * 100 : easedProgress * 100),
      };

    case 'slide-up':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        translateY: baseState.translateY + (isTransitionIn ? (1 - easedProgress) * -100 : easedProgress * -100),
      };

    case 'slide-down':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        translateY: baseState.translateY + (isTransitionIn ? (1 - easedProgress) * 100 : easedProgress * 100),
      };

    case 'scale-in':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        scale: baseState.scale * (isTransitionIn ? easedProgress : (2 - easedProgress)),
      };

    case 'scale-out':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        scale: baseState.scale * (isTransitionIn ? (2 - easedProgress) : easedProgress),
      };

    case 'zoom-in':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        scale: baseState.scale * (isTransitionIn ? (0.5 + easedProgress * 0.5) : (0.5 + (1 - easedProgress) * 0.5)),
      };

    case 'zoom-out':
      return {
        ...baseState,
        opacity: baseState.opacity * easedProgress,
        scale: baseState.scale * (isTransitionIn ? (1.5 - easedProgress * 0.5) : (1.5 - (1 - easedProgress) * 0.5)),
      };

    default:
      return baseState;
  }
}

/**
 * Cubic ease-in-out function for smoother transitions
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Check if a clip should be visible at the current time (accounting for transitions)
 */
export function isClipVisibleAtTime(clip: Clip, currentTimeMs: number): boolean {
  return currentTimeMs >= clip.startMs && currentTimeMs <= clip.startMs + clip.durationMs;
}
