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
  const [debugPanelOpen, setDebugPanelOpen] = useState(() => process.env.NODE_ENV !== 'production');
  const [canvasStyleDebug, setCanvasStyleDebug] = useState<
    { zIndex: string; pointerEvents: string; position: string } | null
  >(null);

  const { currentPhase, animationProgress, assetsLoaded, userInteracted } = state;

  const accessibility = useAccessibility(
    currentPhase,
    animationProgress
  );

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelOpen(prev => !prev);
  }, []);

  const animationSequenceRef = useRef<AnimationSequence | null>(null);
  const beginTriggeredRef = useRef(false);
  const completionGuardRef = useRef(false);
  const assetProgressStopRef = useRef<(() => void) | null>(null);
  const progressRafRef = useRef<number | null>(null);
  const assetProgressLogRef = useRef(-1);

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
      if (process.env.NODE_ENV !== 'production') {
        console.log('[LoadingScreen] initiateLoadingSequence called', {
          options,
          beginTriggered: beginTriggeredRef.current,
          awaitingBegin,
          animationsDisabled
        });
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.log('[LoadingScreen] begin sequence accepted', {
          audioPreferenceState,
          requestedAudioPreference: options?.audioPreference,
          skipTimeline: options?.skipTimeline
        });
      }
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
  assetProgressLogRef.current = -1;
      assetProgressStopRef.current = assetManager.onProgress(progress => {
        if (process.env.NODE_ENV !== 'production') {
          const rounded = Math.round(progress.percentage);
          if (rounded !== assetProgressLogRef.current) {
            assetProgressLogRef.current = rounded;
            console.log('[LoadingScreen] asset progress', {
              percentage: progress.percentage,
              loaded: progress.loaded,
              total: progress.total
            });
          }
        }
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
        if (process.env.NODE_ENV !== 'production') {
          console.log('[LoadingScreen] essential assets loaded');
        }
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
        if (process.env.NODE_ENV !== 'production') {
          console.error('[LoadingScreen] essential asset load failed', error);
        }
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
          if (process.env.NODE_ENV !== 'production') {
            console.log('[LoadingScreen] optional asset preload complete');
          }
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
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[LoadingScreen] optional asset preload issue', err);
          } else {
            console.warn('Optional asset preload issue:', err);
          }
        });

      if (options?.skipTimeline || animationsDisabled) {
        setAnimationsDisabled(true);
        setState(prev => ({
          ...prev,
          currentPhase: LoadingPhase.COMPLETE,
          animationProgress: 1
        }));
        if (process.env.NODE_ENV !== 'production') {
          console.log('[LoadingScreen] timeline skipped', {
            skipTimeline: options?.skipTimeline,
            animationsDisabled
          });
        }
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
      if (process.env.NODE_ENV !== 'production') {
        console.log('[LoadingScreen] particle sequence complete', {
          animationProgress,
          currentPhase
        });
      }
      setState(prev => ({
        ...prev,
        currentPhase: LoadingPhase.COMPLETE,
        animationProgress: 1
      }));
      completeWithParticleState(particleState);
    },
    [completeWithParticleState, animationProgress, currentPhase]
  );

  const handleParticleError = useCallback(
    (message: string) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[LoadingScreen] particle error', message);
      }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('[LoadingScreen] skip requested');
    }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('[LoadingScreen] BEGIN pressed');
    }
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

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    console.log('[LoadingScreen] state snapshot', {
      awaitingBegin,
      animationsDisabled,
      currentPhase,
      animationProgress,
      assetsLoaded,
      userInteracted,
      beginTriggered: beginTriggeredRef.current
    });
  }, [
    awaitingBegin,
    animationsDisabled,
    currentPhase,
    animationProgress,
    assetsLoaded.audio,
    assetsLoaded.fonts,
    assetsLoaded.shaders,
    assetsLoaded.textures,
    assetsLoaded.totalProgress,
    userInteracted
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const { zIndex, pointerEvents, position } = window.getComputedStyle(canvas);
      console.log('[LoadingScreen] canvas style snapshot', {
        zIndex,
        pointerEvents,
        position
      });
      setCanvasStyleDebug({ zIndex, pointerEvents, position });
    } else {
      console.log('[LoadingScreen] no canvas element detected for style snapshot');
      setCanvasStyleDebug(null);
    }
  }, [awaitingBegin, animationsDisabled]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const beginButton = document.querySelector('[data-testid="begin-button"]') as HTMLElement | null;
    if (beginButton) {
      const rect = beginButton.getBoundingClientRect();
      console.log('[LoadingScreen] begin button rect', rect);
      beginButton.style.outline = '2px solid #22d3ee';
      beginButton.style.outlineOffset = '4px';
    } else {
      console.warn('[LoadingScreen] begin button not found in DOM');
    }
    const centerElements = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    console.log('[LoadingScreen] elements at viewport center', centerElements.map(el => {
      if (!(el instanceof HTMLElement)) return el.tagName;
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className ? `.${el.className}` : ''}`;
    }));
  }, [awaitingBegin, animationsDisabled]);

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
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#020617] text-white overflow-hidden"
      data-testid="loading-screen"
      aria-label="Loading application"
      role="progressbar"
      aria-valuenow={Math.round(ringProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
      aria-busy={state.currentPhase !== LoadingPhase.COMPLETE}
      style={{
        ...accessibility.getAccessibilityStyles(),
        ...(process.env.NODE_ENV !== 'production'
          ? { boxShadow: 'inset 0 0 0 4px rgba(56, 189, 248, 0.45)' }
          : undefined)
      }}
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

    <div className="absolute inset-0 pointer-events-none z-[120] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent_60%)]" />

    <div className="relative z-[200] flex flex-col items-center justify-center w-full h-full px-6">
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

      {process.env.NODE_ENV !== 'production' && (
        <div className="absolute bottom-4 left-4 z-[500] pointer-events-auto text-[11px] font-mono">
          <button
            type="button"
            onClick={toggleDebugPanel}
            className="rounded-full border border-white/30 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/60 hover:text-white"
          >
            {debugPanelOpen ? 'Hide Loading Debug' : 'Show Loading Debug'}
          </button>
          {debugPanelOpen && (
            <div className="mt-3 max-w-xs space-y-2 rounded-lg border border-white/25 bg-black/80 p-3 text-[10px] leading-relaxed text-white/80 shadow-lg backdrop-blur-sm">
              <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
                <span className="text-white/50">awaitingBegin</span>
                <span>{String(awaitingBegin)}</span>
                <span className="text-white/50">animationsDisabled</span>
                <span>{String(animationsDisabled)}</span>
                <span className="text-white/50">phase</span>
                <span>{currentPhase}</span>
                <span className="text-white/50">progress</span>
                <span>{animationProgress.toFixed(3)}</span>
                <span className="text-white/50">ringProgress</span>
                <span>{ringProgress.toFixed(3)}</span>
                <span className="text-white/50">userInteracted</span>
                <span>{String(userInteracted)}</span>
                <span className="text-white/50">audioPref</span>
                <span>{audioPreferenceState}</span>
                <span className="text-white/50">skipProp</span>
                <span>{String(skipAnimation)}</span>
                <span className="text-white/50">beginTriggered</span>
                <span>{String(beginTriggeredRef.current)}</span>
              </div>
              <div>
                <p className="mb-1 text-white/50">assetsLoaded</p>
                <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
                  {Object.entries(assetsLoaded).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <span className="text-white/50">{key}</span>
                      <span>{typeof value === 'number' ? value.toFixed(3) : String(value)}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-white/50">canvasStyle</p>
                {canvasStyleDebug ? (
                  <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
                    {Object.entries(canvasStyleDebug).map(([key, value]) => (
                      <React.Fragment key={key}>
                        <span className="text-white/50">{key}</span>
                        <span>{value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">No canvas detected</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LoadingScreen;