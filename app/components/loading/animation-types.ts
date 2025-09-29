/**
 * Animation Sequence Types and Interfaces
 * 
 * Defines interfaces for GSAP-powered animation timeline management.
 */

import { LoadingPhase } from './types';

export interface AnimationSequenceConfig {
  phases: AnimationPhaseConfig[];
  totalDuration: number; // Must be 3000-5000ms (3-5 seconds)
  onPhaseChange?: (phase: LoadingPhase, progress: number) => void;
  onComplete?: () => void;
  onError?: (error: AnimationError) => void;
}

export interface AnimationPhaseConfig {
  name: LoadingPhase;
  duration: number;
  delay?: number;
  easing?: string; // GSAP easing function
  parallel?: boolean; // Can run parallel with next phase
}

export interface AnimationError {
  type: 'invalid-config' | 'animation-error' | 'timeline-error';
  message: string;
  phase?: LoadingPhase;
}

export interface AnimationSequenceInterface {
  // Lifecycle
  initialize(config: AnimationSequenceConfig): void;
  dispose(): void;
  
  // Playback Control
  play(): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  
  // Timeline Management
  skipToPhase(phase: LoadingPhase): void;
  skipToEnd(): void;
  
  // State Query
  getCurrentPhase(): LoadingPhase;
  getProgress(): number; // 0-1 normalized
  isPlaying(): boolean;
}

// GSAP Timeline wrapper types
export interface GSAPTimelineState {
  timeline?: gsap.core.Timeline;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  progress: number;
}

// Animation timing constants from research
export const ANIMATION_TIMING = {
  TOTAL_MIN: 3000,
  TOTAL_MAX: 5000,
  TOTAL_RECOMMENDED: 4000,
  PHASES: {
    INITIALIZING: { min: 300, max: 800, recommended: 500 },
    LOADING_ASSETS: { min: 800, max: 1500, recommended: 1000 },
    ANIMATING: { min: 2000, max: 3000, recommended: 2500 },
    TRANSITIONING: { min: 500, max: 1200, recommended: 800 },
    COMPLETE: { min: 100, max: 300, recommended: 200 },
  }
} as const;