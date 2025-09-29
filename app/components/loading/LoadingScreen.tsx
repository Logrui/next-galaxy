/**
 * LoadingScreen Component - Main Loading Screen Integration
 * 
 * Orchestrates the complete loading experience using ShimmerRing, AudioController,
 * ParticleExplosion, and AnimationSequence components.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from './AccessibilityEnhancer';
import { LoadingScreenProps, LoadingScreenState, LoadingPhase } from './types';
import { preloadAssets } from '../../utils/AssetManager';

export function LoadingScreen({ onComplete, onError }: LoadingScreenProps) {
  // Minimal state just to satisfy existing accessibility hook usage
  const [state, setState] = useState<LoadingScreenState>({
    currentPhase: LoadingPhase.INITIALIZING,
    assetsLoaded: { textures: false, shaders: false, audio: false, fonts: false, totalProgress: 0 },
    animationProgress: 0,
    userInteracted: false,
    webglSupported: true
  });
  const [awaitingBegin, setAwaitingBegin] = useState(true);

  const accessibility = useAccessibility(state.currentPhase, state.animationProgress);

  // Basic WebGL support check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setState(prev => ({ ...prev, webglSupported: false }));
        onError({ type: 'webgl-failure', message: 'WebGL not supported', recoverable: false });
      }
    } catch {
      setState(prev => ({ ...prev, webglSupported: false }));
      onError({ type: 'webgl-failure', message: 'WebGL initialization error', recoverable: false });
    }
  }, [onError]);

  // First interaction marker
  useEffect(() => {
    const mark = () => setState(p => ({ ...p, userInteracted: true }));
    window.addEventListener('click', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    window.addEventListener('touchstart', mark, { once: true });
    return () => {
      window.removeEventListener('click', mark);
      window.removeEventListener('keydown', mark);
      window.removeEventListener('touchstart', mark);
    };
  }, []);

  const buildStubParticleState = () => {
    // Provide a correctly sized particle state so galaxy handoff logic finds expected counts
    const count = 32768; // must align with ParticleSystem expectation
    return {
      particleCount: count,
      positions: new Float32Array(count * 3),
      colors: new Float32Array(count * 3),
      velocities: new Float32Array(count * 3),
      phase: LoadingPhase.COMPLETE
    };
  };

  const handleBegin = useCallback(async () => {
    setAwaitingBegin(false);
    // Preload essential assets before transitioning so GalaxyCanvas finds textures immediately
    try {
      await preloadAssets();
    } catch (e) {
      console.warn('Asset preloading encountered an issue (continuing anyway):', e);
    }
    onComplete(buildStubParticleState());
  }, [onComplete]);

  if (!state.webglSupported) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white text-center p-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">WebGL Not Supported</h2>
          <button
            onClick={() => onComplete(buildStubParticleState())}
            className="px-6 py-2 border border-white/30 hover:border-white/60 transition-colors text-xs tracking-[0.3em]"
          >
            CONTINUE ANYWAY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black"
      data-testid="loading-screen"
      aria-label="Loading application"
      role="progressbar"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
      aria-busy={false}
      style={{ ...accessibility.getAccessibilityStyles() }}
      tabIndex={accessibility.config.focusManagement ? 0 : undefined}
    >
      <accessibility.AnnouncementRegion />

      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
        <div className="absolute top-36 left-1/2 -translate-x-1/2 text-[36px] tracking-[0.35em] text-white/90 select-none" style={{ letterSpacing: '0.35em' }} aria-hidden>
          SYHC
        </div>
        {awaitingBegin && (
          <div className="relative flex items-center justify-center group" style={{ width: 340, height: 340 }}>
            <style jsx>{`
              @keyframes ringBreath { 
                0% { transform: scale(1) translateZ(0); }
                35% { transform: scale(1.10) translateZ(0); }
                70% { transform: scale(1.03) translateZ(0); }
                100% { transform: scale(1) translateZ(0); }
              }
              @keyframes ringContract { 
                0% { transform: scale(var(--base-scale)); }
                55% { transform: scale(calc(var(--base-scale) * 0.55)); }
                100% { transform: scale(calc(var(--base-scale) * 0.62)); }
              }
              .begin-ring { 
                animation: ringBreath 5.5s ease-in-out infinite;
                transition: border-color .9s ease, opacity 1.2s ease; 
                will-change: transform, border-color, opacity; 
              }
              .group:hover .begin-ring { 
                animation: ringContract 3.2s cubic-bezier(.7,.05,.25,1) forwards; 
                border-color: var(--accent-blue) !important; 
              }
            `}</style>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {([72, 96] as number[]).map((inset, i) => {
                const opacitySequence = [0.8, 0.9];
                const opacity = opacitySequence[i] ?? 0.8;
                return (
                  <div
                    key={i}
                    className="begin-ring absolute rounded-full border"
                    style={{
                      inset,
                      '--base-scale': 1 + i * 0.04,
                      opacity,
                      borderColor: 'rgba(255,255,255,0.30)',
                      animationDelay: `${i * 300}ms`,
                      transform: `scale(${1 + i * 0.04})`,
                      transformOrigin: '50% 50%'
                    } as React.CSSProperties}
                  />
                );
              })}
            </div>
            <button
              onClick={handleBegin}
              data-testid="begin-button"
              className="relative z-10 w-56 h-56 rounded-full border border-white/25 text-[20px] tracking-[0.4em] text-white/80 focus:outline-none transition-all duration-700 group-hover:border-[color:var(--accent-blue)] group-hover:text-[color:var(--accent-blue)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.55)] group-hover:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ letterSpacing: '0.4em', backdropFilter: 'blur(4px)' }}
              disabled={!state.webglSupported}
            >
              BEGIN
            </button>
          </div>
        )}
        {awaitingBegin && (
          <button
            onClick={handleBegin}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.35em] text-white/55 hover:text-white/80 transition-colors"
          >
            CONTINUE WITHOUT AUDIO
          </button>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;