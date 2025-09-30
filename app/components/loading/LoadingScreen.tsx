/**
 * LoadingScreen Component - Main Loading Screen Integration
 * 
 * Orchestrates the complete loading experience using ShimmerRing, AudioController,
 * ParticleExplosion, and AnimationSequence components.
 */

'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react';
import { useAccessibility } from './AccessibilityEnhancer';
import {
  LoadingScreenProps,
  LoadingScreenState,
  LoadingPhase,
  ParticleSystemState
} from './types';
import ShimmerRing from './ShimmerRing';
import AudioController from './AudioController';
import ParticleExplosion from './ParticleExplosion';
import { AudioControllerConfig } from './audio-types';
import { AnimationSequence } from './AnimationSequence';
import {
  getAssetManager,
  loadEssentialAssets,
  preloadAssets
} from '../../utils/AssetManager';

export function LoadingScreen({
  onComplete,
  onError,
  skipAnimation = false,
  audioPreference = 'ask'
}: LoadingScreenProps) {
  const [audioPreferenceState, setAudioPreferenceState] = useState<
    'enabled' | 'disabled' | 'ask'
  >(audioPreference);

  const [state, setState] = useState<LoadingScreenState>({
    currentPhase: LoadingPhase.INITIALIZING,
    assetsLoaded: {
      textures: false,
      shaders: false,
      audio: audioPreference === 'disabled',
      fonts: false,
      totalProgress: 0
    },
    animationProgress: 0,
    userInteracted: false,
    webglSupported: true
  });

  const [awaitingBegin, setAwaitingBegin] = useState(() => !skipAnimation);
  const [animationsDisabled, setAnimationsDisabled] = useState(() => !!skipAnimation);

  const accessibility = useAccessibility(
    state.currentPhase,
    state.animationProgress
  );

  const animationSequenceRef = useRef<AnimationSequence | null>(null);
  const beginTriggeredRef = useRef(false);
  const completionGuardRef = useRef(false);
  const assetProgressStopRef = useRef<(() => void) | null>(null);
  const progressRafRef = useRef<number | null>(null);

  const audioConfig = useMemo<AudioControllerConfig>(
    () => ({
      preference: audioPreferenceState,
      volume: 0.65,
      fadeInDuration: 1600,
      fadeOutDuration: 600
    }),
    [audioPreferenceState]
  );

  const buildStubParticleState = useCallback(() => {
    const count = 32768;
    return {
      particleCount: count,
      positions: new Float32Array(count * 3),
      colors: new Float32Array(count * 3),
      velocities: new Float32Array(count * 3),
      phase: LoadingPhase.COMPLETE
    };
  }, []);

  const cleanupAssetProgress = useCallback(() => {
    assetProgressStopRef.current?.();
    assetProgressStopRef.current = null;
  }, []);

  const completeWithParticleState = useCallback(
    (particleState?: ParticleSystemState) => {
      if (completionGuardRef.current) return;
      completionGuardRef.current = true;
      onComplete(particleState ?? buildStubParticleState());
    },
    [onComplete, buildStubParticleState]
  );

  const startAnimationSequence = useCallback(
    async () => {
      animationSequenceRef.current?.dispose();
      animationSequenceRef.current = new AnimationSequence();

      try {
        animationSequenceRef.current.initialize({
          totalDuration: 4200,
          phases: [
            { name: LoadingPhase.LOADING_ASSETS, duration: 900 },
            { name: LoadingPhase.ANIMATING, duration: 2000 },
            { name: LoadingPhase.TRANSITIONING, duration: 900 }
          ],
          onPhaseChange: (phase, progress) => {
            setState(prev => {
              if (
                prev.currentPhase === phase &&
                Math.abs(prev.animationProgress - progress) < 0.005
              ) {
                return prev;
              }
              return {
                ...prev,
                currentPhase: phase,
                animationProgress: progress
              };
            });
          },
          onComplete: () => {
            setState(prev => ({
              ...prev,
              animationProgress: 1,
              currentPhase: LoadingPhase.TRANSITIONING
            }));
          },
          onError: error =>
            onError({
              type: 'animation-error',
              message: error.message,
              recoverable: false
            })
        });
        await animationSequenceRef.current.play();
      } catch (error) {
        onError({
          type: 'animation-error',
          message:
            error instanceof Error
              ? error.message
              : 'Animation timeline failed',
          recoverable: false
        });
      }
    },
    [onError]
  );

  const initiateLoadingSequence = useCallback(
    async (options?: { skipTimeline?: boolean; audioPreference?: 'enabled' | 'disabled' }) => {
      if (beginTriggeredRef.current) {
        if (options?.skipTimeline) {
          setAnimationsDisabled(true);
          setState(prev => ({
            ...prev,
            currentPhase: LoadingPhase.COMPLETE,
            animationProgress: 1
          }));
          completeWithParticleState();
        }
        return;
      }

      beginTriggeredRef.current = true;
      setAwaitingBegin(false);
      const nextAudioPreference = options?.audioPreference ?? audioPreferenceState;
      if (options?.audioPreference && options.audioPreference !== audioPreferenceState) {
        setAudioPreferenceState(options.audioPreference);
      }

      setState(prev => ({
        ...prev,
        userInteracted: true,
        currentPhase: LoadingPhase.LOADING_ASSETS,
        assetsLoaded: {
          ...prev.assetsLoaded,
          totalProgress: 0,
          audio: prev.assetsLoaded.audio || nextAudioPreference === 'disabled'
        }
      }));

      const assetManager = getAssetManager();
      cleanupAssetProgress();
      assetProgressStopRef.current = assetManager.onProgress(progress => {
        setState(prev => ({
          ...prev,
          assetsLoaded: {
            ...prev.assetsLoaded,
            totalProgress: Math.min(1, progress.percentage / 100)
          }
        }));
      });

      try {
        await loadEssentialAssets();
        setState(prev => ({
          ...prev,
          assetsLoaded: {
            ...prev.assetsLoaded,
            textures: true,
            shaders: true,
            totalProgress: 1
          }
        }));
      } catch (error) {
        beginTriggeredRef.current = false;
        setAwaitingBegin(true);
        cleanupAssetProgress();
        onError({
          type: 'asset-load-failed',
          message:
            error instanceof Error
              ? error.message
              : 'Asset loading failed',
          recoverable: true
        });
        return;
      }

      cleanupAssetProgress();

      preloadAssets()
        .then(() => {
          setState(prev => ({
            ...prev,
            assetsLoaded: {
              ...prev.assetsLoaded,
              audio: true,
              fonts: true
            }
          }));
        })
        .catch(err => {
          console.warn('Optional asset preload issue:', err);
        });

      if (options?.skipTimeline || animationsDisabled) {
        setAnimationsDisabled(true);
        setState(prev => ({
          ...prev,
          currentPhase: LoadingPhase.COMPLETE,
          animationProgress: 1
        }));
        completeWithParticleState();
        return;
      }

      startAnimationSequence();
    },
    [
      animationsDisabled,
      audioPreferenceState,
      cleanupAssetProgress,
      completeWithParticleState,
      onError,
      startAnimationSequence
    ]
  );

  const handleParticleComplete = useCallback(
    (particleState: ParticleSystemState) => {
      setState(prev => ({
        ...prev,
        currentPhase: LoadingPhase.COMPLETE,
        animationProgress: 1
      }));
      completeWithParticleState(particleState);
    },
    [completeWithParticleState]
  );

  const handleParticleError = useCallback(
    (message: string) => {
      onError({
        type: 'animation-error',
        message,
        recoverable: true
      });
      completeWithParticleState();
    },
    [completeWithParticleState, onError]
  );

  const handleSkip = useCallback(() => {
    setAnimationsDisabled(true);
    animationSequenceRef.current?.skipToEnd();
    animationSequenceRef.current?.dispose();
    setState(prev => ({
      ...prev,
      currentPhase: LoadingPhase.COMPLETE,
      animationProgress: 1
    }));
    completeWithParticleState();
  }, [completeWithParticleState]);

  const handleBegin = useCallback(() => {
    initiateLoadingSequence();
  }, [initiateLoadingSequence]);

  // WebGL capability check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setState(prev => ({ ...prev, webglSupported: false }));
        onError({
          type: 'webgl-failure',
          message: 'WebGL not supported',
          recoverable: false
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, webglSupported: false }));
      onError({
        type: 'webgl-failure',
        message:
          error instanceof Error
            ? error.message
            : 'WebGL initialization error',
        recoverable: false
      });
    }
  }, [onError]);

  // mark first interaction for accessibility tracking
  useEffect(() => {
    const mark = () => setState(prev => ({ ...prev, userInteracted: true }));
    window.addEventListener('click', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    window.addEventListener('touchstart', mark, { once: true });
    return () => {
      window.removeEventListener('click', mark);
      window.removeEventListener('keydown', mark);
      window.removeEventListener('touchstart', mark);
    };
  }, []);

  // respond to external audio preference changes
  useEffect(() => {
    setAudioPreferenceState(audioPreference);
    setState(prev => ({
      ...prev,
      assetsLoaded: {
        ...prev.assetsLoaded,
        audio: prev.assetsLoaded.audio || audioPreference === 'disabled'
      }
    }));
  }, [audioPreference]);

  // Auto-start when skipAnimation prop provided
  useEffect(() => {
    if (skipAnimation) {
      initiateLoadingSequence({ skipTimeline: true });
    }
  }, [skipAnimation, initiateLoadingSequence]);

  // Animation progress polling for accessibility feedback
  useEffect(() => {
    if (animationsDisabled || awaitingBegin) {
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      return;
    }

    const update = () => {
      if (animationSequenceRef.current) {
        const progress = animationSequenceRef.current.getProgress();
        setState(prev => {
          if (Math.abs(prev.animationProgress - progress) < 0.005) {
            return prev;
          }
          return {
            ...prev,
            animationProgress: progress
          };
        });
      }
      progressRafRef.current = requestAnimationFrame(update);
    };

    progressRafRef.current = requestAnimationFrame(update);

    return () => {
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
    };
  }, [animationsDisabled, awaitingBegin]);

  useEffect(() => () => cleanupAssetProgress(), [cleanupAssetProgress]);

  useEffect(
    () => () => {
      animationSequenceRef.current?.dispose();
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
      }
    },
    []
  );

  if (!state.webglSupported) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white text-center p-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">WebGL Not Supported</h2>
          <button
            onClick={() => completeWithParticleState()}
            className="px-6 py-2 border border-white/30 hover:border-white/60 transition-colors text-xs tracking-[0.3em]"
          >
            CONTINUE ANYWAY
          </button>
        </div>
      </div>
    );
  }

  const ringProgress =
    state.currentPhase === LoadingPhase.LOADING_ASSETS
      ? state.assetsLoaded.totalProgress
      : state.animationProgress;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#020617] text-white overflow-hidden"
      data-testid="loading-screen"
      aria-label="Loading application"
      role="progressbar"
      aria-valuenow={Math.round(ringProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
      aria-busy={state.currentPhase !== LoadingPhase.COMPLETE}
      style={{ ...accessibility.getAccessibilityStyles() }}
      tabIndex={accessibility.config.focusManagement ? 0 : undefined}
    >
      <accessibility.AnnouncementRegion />

      {!animationsDisabled && !awaitingBegin && (
        <ParticleExplosion
          phase={state.currentPhase}
          progress={state.animationProgress}
          onComplete={handleParticleComplete}
          onError={handleParticleError}
        />
      )}

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent_60%)]" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6">
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 text-xs tracking-[0.6em] uppercase text-white/70 select-none"
          aria-hidden
        >
          SYHC
        </div>

        {awaitingBegin ? (
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex items-center justify-center" style={{ width: 360, height: 360 }}>
              <style jsx>{`
                @keyframes pulseRing {
                  0% { transform: scale(1); opacity: 0.6; }
                  50% { transform: scale(1.08); opacity: 0.85; }
                  100% { transform: scale(1); opacity: 0.6; }
                }
                .begin-ring {
                  animation: pulseRing 6s ease-in-out infinite;
                  will-change: transform, opacity;
                }
              `}</style>
              {[70, 105, 150].map((radius, idx) => (
                <div
                  key={radius}
                  className="begin-ring absolute rounded-full border border-white/20"
                  style={{
                    inset: radius,
                    animationDelay: `${idx * 500}ms`
                  }}
                />
              ))}
              <button
                onClick={handleBegin}
                data-testid="begin-button"
                className="relative z-10 w-56 h-56 rounded-full border border-white/30 text-[18px] tracking-[0.45em] text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] transition-all duration-700 hover:scale-95 hover:border-blue-400/70 hover:text-blue-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ letterSpacing: '0.45em', backdropFilter: 'blur(6px)' }}
                disabled={!state.webglSupported}
              >
                BEGIN
              </button>
            </div>
            <button
              onClick={() => initiateLoadingSequence({ audioPreference: 'disabled' })}
              className="text-[10px] tracking-[0.35em] text-white/55 hover:text-white/80 transition-colors"
            >
              CONTINUE WITHOUT AUDIO
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            <ShimmerRing
              size={260}
              strokeWidth={4}
              phase={state.currentPhase}
              progress={ringProgress}
            />

            <div className="flex flex-col items-center gap-3">
              <span className="text-xs uppercase tracking-[0.5em] text-white/45">Phase</span>
              <span
                data-testid="loading-phase"
                className="text-sm tracking-[0.3em] text-white/80"
              >
                {state.currentPhase.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] tracking-[0.4em] text-white/55">
                {Math.round(ringProgress * 100)}% READY
              </span>
              <accessibility.AccessibleSkipButton
                onSkip={handleSkip}
                visible={
                  !animationsDisabled &&
                  state.currentPhase !== LoadingPhase.LOADING_ASSETS &&
                  state.currentPhase !== LoadingPhase.COMPLETE
                }
              />
            </div>
          </div>
        )}

        {!animationsDisabled && !awaitingBegin && (
          <div className="absolute top-8 right-8">
            <AudioController config={audioConfig} phase={state.currentPhase} />
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;