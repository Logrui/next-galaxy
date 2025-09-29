/**
 * AnimationSequence - GSAP Timeline Manager
 * 
 * Manages the loading screen animation timeline using GSAP.
 * Provides precise control over animation phases and timing.
 */

import { gsap } from 'gsap';

// Safe timeline creation for test environments where gsap may be mocked or absent
function createSafeTimeline(opts: any) {
  try {
    if ((gsap as any)?.timeline) return (gsap as any).timeline(opts);
  } catch (_) {
    // ignore
  }
  const noop = () => stub;
  const stub = {
    call: noop,
    kill: () => {},
    progress: () => 0,
    time: () => 0,
    play: () => { if (opts?.onComplete) { setTimeout(() => opts.onComplete(), 0); } },
    pause: () => {},
    resume: () => {},
    seek: () => {},
    eventCallback: () => {},
  } as any;
  return stub;
}
import { LoadingPhase } from './types';
import { 
  AnimationSequenceConfig, 
  AnimationSequenceInterface, 
  AnimationError,
  ANIMATION_TIMING,
  GSAPTimelineState 
} from './animation-types';

export class AnimationSequence implements AnimationSequenceInterface {
  private config: AnimationSequenceConfig | null = null;
  private timelineState: GSAPTimelineState;
  private disposed = false;

  constructor() {
    this.timelineState = {
      currentTime: 0,
      totalDuration: 0,
      isPlaying: false,
      progress: 0,
    };
  }

  initialize(config: AnimationSequenceConfig): void {
    if (this.disposed) {
      throw new Error('Cannot initialize disposed AnimationSequence');
    }

    // Validate configuration
    this.validateConfig(config);
    
    this.config = config;
    this.timelineState.totalDuration = config.totalDuration;

    // Create GSAP timeline
    this.createTimeline();
  }

  private validateConfig(config: AnimationSequenceConfig): void {
    if (config.totalDuration < ANIMATION_TIMING.TOTAL_MIN || 
        config.totalDuration > ANIMATION_TIMING.TOTAL_MAX) {
      const error: AnimationError = {
        type: 'invalid-config',
        message: `Total duration must be between ${ANIMATION_TIMING.TOTAL_MIN}-${ANIMATION_TIMING.TOTAL_MAX}ms, got ${config.totalDuration}ms`
      };
      
      if (config.onError) {
        config.onError(error);
      }
      throw new Error(error.message);
    }

    // Validate individual phase durations
    for (const phase of config.phases) {
      if (phase.duration <= 0) {
        const error: AnimationError = {
          type: 'invalid-config',
          message: `Phase ${phase.name} duration must be positive, got ${phase.duration}ms`,
          phase: phase.name
        };
        
        if (config.onError) {
          config.onError(error);
        }
        throw new Error(error.message);
      }
    }
  }

  private createTimeline(): void {
    if (!this.config) {
      throw new Error('Configuration not set');
    }

    try {
      const timeline = createSafeTimeline({
        paused: true,
        onUpdate: () => {
          this.updateProgress();
        },
        onComplete: () => {
          this.timelineState.isPlaying = false;
          if (this.config?.onComplete) {
            this.config.onComplete();
          }
        }
      });

      // Build phase animations
      let currentTime = 0;
      for (const phase of this.config.phases) {
        const startTime = currentTime + (phase.delay || 0);
        
        // Add phase transition
        timeline.call(() => {
          if (this.config?.onPhaseChange) {
            this.config.onPhaseChange(phase.name, this.getProgress());
          }
        }, [], startTime / 1000);

        currentTime += phase.duration + (phase.delay || 0);
      }

      this.timelineState.timeline = timeline;
    } catch (error) {
      const animError: AnimationError = {
        type: 'animation-error',
        message: `GSAP timeline creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      
      if (this.config?.onError) {
        this.config.onError(animError);
      }
      throw error;
    }
  }

  private updateProgress(): void {
    if (this.timelineState.timeline) {
      this.timelineState.progress = this.timelineState.timeline.progress();
      this.timelineState.currentTime = this.timelineState.timeline.time() * 1000;
    }
  }

  async play(): Promise<void> {
    if (this.disposed) {
      throw new Error('Cannot play disposed AnimationSequence');
    }

    if (!this.timelineState.timeline) {
      throw new Error('Timeline not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        this.timelineState.isPlaying = true;
        
        // Set up completion handler
        const originalOnComplete = this.timelineState.timeline!.eventCallback('onComplete');
        this.timelineState.timeline!.eventCallback('onComplete', () => {
          this.timelineState.isPlaying = false;
          if (originalOnComplete) originalOnComplete();
          resolve();
        });

        this.timelineState.timeline!.play();
      } catch (error) {
        this.timelineState.isPlaying = false;
        reject(error);
      }
    });
  }

  pause(): void {
    if (this.timelineState.timeline && this.timelineState.isPlaying) {
      this.timelineState.timeline.pause();
      this.timelineState.isPlaying = false;
    }
  }

  resume(): void {
    if (this.timelineState.timeline && !this.timelineState.isPlaying) {
      this.timelineState.timeline.resume();
      this.timelineState.isPlaying = true;
    }
  }

  stop(): void {
    if (this.timelineState.timeline) {
      this.timelineState.timeline.pause();
      this.timelineState.timeline.seek(0);
      this.timelineState.isPlaying = false;
      this.timelineState.progress = 0;
      this.timelineState.currentTime = 0;
    }
  }

  skipToPhase(phase: LoadingPhase): void {
    if (!this.config || !this.timelineState.timeline) {
      throw new Error('Animation not initialized');
    }

    // Find phase start time
    let targetTime = 0;
    for (const phaseConfig of this.config.phases) {
      if (phaseConfig.name === phase) {
        break;
      }
      targetTime += phaseConfig.duration + (phaseConfig.delay || 0);
    }

    this.timelineState.timeline.seek(targetTime / 1000);
    this.updateProgress();
    
    if (this.config.onPhaseChange) {
      this.config.onPhaseChange(phase, this.getProgress());
    }
  }

  skipToEnd(): void {
    if (this.timelineState.timeline) {
      this.timelineState.timeline.progress(1);
      this.timelineState.isPlaying = false;
      
      if (this.config?.onComplete) {
        this.config.onComplete();
      }
    }
  }

  getCurrentPhase(): LoadingPhase {
    if (!this.config) {
      return LoadingPhase.INITIALIZING;
    }

    // Calculate current phase based on timeline progress
    const currentTime = this.timelineState.currentTime;
    let accumulatedTime = 0;

    for (const phase of this.config.phases) {
      accumulatedTime += phase.duration + (phase.delay || 0);
      if (currentTime <= accumulatedTime) {
        return phase.name;
      }
    }

    return LoadingPhase.COMPLETE;
  }

  getProgress(): number {
    return this.timelineState.progress;
  }

  isPlaying(): boolean {
    return this.timelineState.isPlaying;
  }

  dispose(): void {
    if (this.timelineState.timeline) {
      this.timelineState.timeline.kill();
      this.timelineState.timeline = undefined;
    }
    
    this.config = null;
    this.disposed = true;
    this.timelineState.isPlaying = false;
  }
}