/**
 * AudioController Component - Loading Screen Audio Management
 * 
 * Manages audio playback for the loading screen with user preference handling.
 * Supports ambient sounds, particle effects, and transition audio.
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

// Fallback timeline factory for non-GSAP (test) environments
function safeCreateTimeline(config?: any): any {
  try {
    if ((gsap as any)?.timeline) {
      return (gsap as any).timeline(config);
    }
  } catch (_) {
    // ignore
  }
  const noop = () => safeTimeline; // return same timeline for chaining
  const safeTimeline = {
    fromTo: noop,
    to: noop,
    set: noop,
    kill: () => {},
    pause: () => {},
    resume: () => {},
    seek: () => {},
    progress: () => 0,
    time: () => 0,
    play: () => {},
    eventCallback: () => {},
  } as any;
  return safeTimeline;
}
import {
  AudioControllerConfig,
  AudioControllerInterface,
  AudioState,
  AudioAssets 
} from './audio-types';
import { AssetManager } from '../../utils/AssetManager';
import { LoadingPhase } from './types';

export interface AudioControllerProps {
  config: AudioControllerConfig;
  phase: LoadingPhase;
  onStateChange?: (state: AudioState) => void;
  onError?: (error: string) => void;
}

function AudioControllerImpl({ 
  config, 
  phase, 
  onStateChange, 
  onError 
}: AudioControllerProps) {
  const stateRef = useRef<AudioState>({
    enabled: config.preference === 'enabled',
    preference: config.preference,
    volume: config.volume,
    muted: false,
    loading: false
  });

  const assetsRef = useRef<AudioAssets>({});
  const fadeTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Audio Controller Implementation
  const controller = useRef<AudioControllerInterface>({
    initialize: async (config: AudioControllerConfig): Promise<void> => {
      try {
        stateRef.current.loading = true;
        notifyStateChange();

        // Preload audio assets (optional - only if assets exist)
        await loadAudioAssets();
        
        stateRef.current.loading = false;
        stateRef.current.enabled = config.preference === 'enabled';
        notifyStateChange();
      } catch (error) {
        stateRef.current.loading = false;
        stateRef.current.error = error instanceof Error ? error.message : 'Audio initialization failed';
        notifyStateChange();
        onError?.(stateRef.current.error);
      }
    },

    dispose: (): void => {
      // Stop all audio
      Object.values(assetsRef.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      
      // Kill GSAP timeline
      fadeTimelineRef.current?.kill();
      fadeTimelineRef.current = null;
      
      // Clear assets
      assetsRef.current = {};
    },

    playAmbient: async (): Promise<void> => {
      if (!stateRef.current.enabled || !assetsRef.current.ambient) return;
      
      const audio = assetsRef.current.ambient;
      audio.volume = stateRef.current.volume;
      audio.loop = true;
      
      try {
        await audio.play();
      } catch (error) {
        console.warn('Ambient audio playback failed:', error);
      }
    },

    playParticleEffect: async (): Promise<void> => {
      if (!stateRef.current.enabled || !assetsRef.current.particles) return;
      
      const audio = assetsRef.current.particles;
      audio.volume = stateRef.current.volume * 0.7; // Slightly quieter
      audio.currentTime = 0;
      
      try {
        await audio.play();
      } catch (error) {
        console.warn('Particle effect audio playback failed:', error);
      }
    },

    playTransition: async (): Promise<void> => {
      if (!stateRef.current.enabled || !assetsRef.current.transition) return;
      
      const audio = assetsRef.current.transition;
      audio.volume = stateRef.current.volume;
      audio.currentTime = 0;
      
      try {
        await audio.play();
      } catch (error) {
        console.warn('Transition audio playback failed:', error);
      }
    },

    stopAll: (): void => {
      Object.values(assetsRef.current).forEach(audio => {
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    },

    setVolume: (volume: number): void => {
      stateRef.current.volume = Math.max(0, Math.min(1, volume));
      
      Object.values(assetsRef.current).forEach(audio => {
        if (audio) {
          audio.volume = stateRef.current.volume;
        }
      });
      
      notifyStateChange();
    },

    fadeIn: async (duration: number): Promise<void> => {
      return new Promise((resolve) => {
        fadeTimelineRef.current?.kill();
        
        const targetVolume = stateRef.current.volume;
        
        // Set initial volume to 0
        Object.values(assetsRef.current).forEach(audio => {
          if (audio) audio.volume = 0;
        });
        
        fadeTimelineRef.current = safeCreateTimeline({
          onComplete: resolve
        });
        
  fadeTimelineRef.current?.to(stateRef.current, {
          duration: duration / 1000,
          ease: 'power2.out',
          onUpdate: () => {
            const currentVolume = stateRef.current.volume * (1 - fadeTimelineRef.current!.progress());
            Object.values(assetsRef.current).forEach(audio => {
              if (audio) audio.volume = targetVolume - currentVolume;
            });
          }
        });
      });
    },

    fadeOut: async (duration: number): Promise<void> => {
      return new Promise((resolve) => {
        fadeTimelineRef.current?.kill();
        
        const initialVolume = stateRef.current.volume;
        
        fadeTimelineRef.current = safeCreateTimeline({
          onComplete: () => {
            controller.current.stopAll();
            resolve();
          }
        });
        
  fadeTimelineRef.current?.to(stateRef.current, {
          duration: duration / 1000,
          ease: 'power2.in',
          onUpdate: () => {
            const currentVolume = initialVolume * (1 - fadeTimelineRef.current!.progress());
            Object.values(assetsRef.current).forEach(audio => {
              if (audio) audio.volume = currentVolume;
            });
          }
        });
      });
    },

    getState: (): AudioState => {
      return { ...stateRef.current };
    },

    setPreference: (preference: 'enabled' | 'disabled'): void => {
      stateRef.current.preference = preference;
      stateRef.current.enabled = preference === 'enabled';
      
      if (!stateRef.current.enabled) {
        controller.current.stopAll();
      }
      
      notifyStateChange();
    }
  });

  const loadAudioAssets = useCallback(async (): Promise<void> => {
    // Use AssetManager for audio loading with graceful degradation
    const assetManager = AssetManager.getInstance();
    
    const audioMappings = [
      { key: 'ambient', assetKey: 'ambient-space' },
      { key: 'particles', assetKey: 'particle-whoosh' },
      { key: 'transition', assetKey: 'transition-sound' }
    ];

    // Try to get preloaded audio assets
    audioMappings.forEach(({ key, assetKey }) => {
      const audio = assetManager.getAudio(assetKey);
      if (audio) {
        assetsRef.current[key as keyof AudioAssets] = audio;
      }
    });

    // If no audio assets were preloaded, that's fine - the system degrades gracefully
    if (Object.keys(assetsRef.current).length === 0) {
      console.debug('No audio assets loaded - continuing with silent operation');
    }
  }, []);

  const notifyStateChange = useCallback(() => {
    onStateChange?.(controller.current.getState());
  }, [onStateChange]);

  // Initialize controller
  useEffect(() => {
    controller.current.initialize(config);
    
    return () => {
      controller.current.dispose();
    };
  }, [config]);

  // Handle phase changes
  useEffect(() => {
    if (!stateRef.current.enabled) return;

    switch (phase) {
      case LoadingPhase.INITIALIZING:
        controller.current.fadeIn(config.fadeInDuration);
        controller.current.playAmbient();
        break;
        
      case LoadingPhase.ANIMATING:
        controller.current.playParticleEffect();
        break;
        
      case LoadingPhase.TRANSITIONING:
        controller.current.playTransition();
        break;
        
      case LoadingPhase.COMPLETE:
        controller.current.fadeOut(config.fadeOutDuration);
        break;
    }
  }, [phase, config.fadeInDuration, config.fadeOutDuration]);

  // Audio preference UI (if preference is 'ask')
  if (config.preference === 'ask' && !stateRef.current.loading) {
    return (
      <div 
        className="fixed top-4 right-4 z-[240] p-4 rounded-lg"
        style={{
          background: 'var(--glass-primary)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-glass)'
        }}
      >
        <p className="text-sm text-gray-300 mb-3">
          Enable loading screen audio?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => controller.current.setPreference('enabled')}
            className="px-3 py-1 text-xs rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
            aria-label="Enable audio for loading screen"
          >
            Yes
          </button>
          <button
            onClick={() => controller.current.setPreference('disabled')}
            className="px-3 py-1 text-xs rounded bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 transition-colors"
            aria-label="Disable audio for loading screen"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  // No visible UI for audio controller when preference is set
  return null;
}

// Named + default export of the implementation
export { AudioControllerImpl as AudioController, type AudioControllerInterface };
export default AudioControllerImpl;